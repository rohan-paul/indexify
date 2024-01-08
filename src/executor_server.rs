use std::{net::SocketAddr, sync::Arc, time::Duration};

use anyhow::Result;
use axum::{
    extract::State,
    routing::{get, post},
    Json,
    Router,
};
use axum_otel_metrics::HttpMetricsLayerBuilder;
use axum_tracing_opentelemetry::middleware::OtelAxumLayer;
use tokio::{signal, sync::watch, time::interval};
use tracing::{error, info};

use crate::{
    api::IndexifyAPIError,
    executor::ExtractorExecutor,
    extractor::{extractor_runner, py_extractors, python_path},
    internal_api::{ExtractRequest, ExtractResponse},
    server_config::{ExecutorConfig, ExtractorConfig},
};

pub struct ExecutorServer {
    executor_config: Arc<ExecutorConfig>,
    extractor_config_path: String,
}

impl ExecutorServer {
    pub async fn new(
        extractor_config_path: &str,
        executor_config: Arc<ExecutorConfig>,
    ) -> Result<Self> {
        // Set Python Path
        python_path::set_python_path(extractor_config_path)?;

        Ok(Self {
            executor_config,
            extractor_config_path: extractor_config_path.into(),
        })
    }

    pub async fn run(&self) -> Result<(), anyhow::Error> {
        let addr: SocketAddr = self.executor_config.listen_addr_sock()?;
        let listener = tokio::net::TcpListener::bind(addr).await?;
        let listen_addr = listener.local_addr()?.to_string();
        let listen_port = listener.local_addr()?.port();
        let advertise_addr = format!("{}:{}", self.executor_config.advertise_if, listen_port);
        let extractor_config = ExtractorConfig::from_path(&self.extractor_config_path)?;
        let extractor =
            py_extractors::PythonExtractor::new_from_extractor_path(&extractor_config.module)?;
        let extractor_runner =
            extractor_runner::ExtractorRunner::new(Arc::new(extractor), extractor_config);
        let executor = Arc::new(
            ExtractorExecutor::new(
                self.executor_config.clone(),
                extractor_runner,
                advertise_addr.clone(),
            )
            .await?,
        );
        let metrics = HttpMetricsLayerBuilder::new().build();
        let app = Router::new()
            .merge(metrics.routes())
            .route("/", get(root))
            .route(
                "/sync_executor",
                post(sync_worker).with_state(executor.clone()),
            )
            .route("/extract", post(extract).with_state(executor.clone()))
            //start OpenTelemetry trace on incoming request
            .layer(OtelAxumLayer::default())
            .layer(metrics);

        info!(
            "starting executor server on: {}, advertising: {}",
            listen_addr,
            advertise_addr.clone()
        );
        let (tx, rx) = watch::channel::<()>(());
        tokio::spawn(async move {
            let mut rx = rx.clone();
            let mut int = interval(Duration::from_secs(5));
            int.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Delay);
            loop {
                tokio::select! {
                    _ = rx.changed() => {
                        info!("shutting down executor server");
                        break;
                    },
                    _ = int.tick() => {
                        info!("executor server is running");
                        int.tick().await;
                    }
                };
            }
        });
        axum::serve(listener, app.into_make_service())
            .with_graceful_shutdown(async move {
                let _ = shutdown_signal().await;
                tx.send(()).unwrap()
            })
            .await?;
        Ok(())
    }
}

#[tracing::instrument]
async fn root() -> &'static str {
    "Indexify Extractor Server"
}

#[tracing::instrument]
#[axum::debug_handler]
async fn extract(
    extractor_executor: State<Arc<ExtractorExecutor>>,
    Json(query): Json<ExtractRequest>,
) -> Result<Json<ExtractResponse>, IndexifyAPIError> {
    let content = extractor_executor
        .extract(query.content, query.input_params)
        .await;

    match content {
        Ok(content) => Ok(Json(ExtractResponse { content })),
        Err(err) => {
            error!("unable to extract content: {}", err.to_string());
            Err(IndexifyAPIError::new(
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                err.to_string(),
            ))
        }
    }
}

#[axum::debug_handler]
async fn sync_worker(
    extractor_executor: State<Arc<ExtractorExecutor>>,
) -> Result<(), IndexifyAPIError> {
    let extractor_executor = extractor_executor;
    tokio::spawn(async move {
        let _ = extractor_executor.heartbeat().await;
    });
    Ok(())
}

async fn shutdown_signal() {
    let ctrl_c = async {
        signal::ctrl_c()
            .await
            .expect("failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("failed to install signal handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {
        },
        _ = terminate => {
        },
    }
    info!("signal received, shutting down server gracefully");
}
