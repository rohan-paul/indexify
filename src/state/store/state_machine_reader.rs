use std::{collections::HashSet, sync::Arc};

use rocksdb::OptimisticTransactionDB;
use tracing::error;

use super::{
    serializer::{JsonEncode, JsonEncoder},
    StateMachineColumns, StateMachineError,
};
use indexify_internal_api;

#[derive(Clone)]
pub struct StateMachineReader {}

impl StateMachineReader {
    pub async fn get_tasks_for_executor(
        &self,
        executor_id: &str,
        limit: Option<u64>,
        db: &Arc<OptimisticTransactionDB>,
    ) -> Result<Vec<indexify_internal_api::Task>, StateMachineError> {
        //  NOTE: Don't do deserialization within the transaction
        let txn = db.transaction();
        let task_ids_key = executor_id.as_bytes();
        let task_ids_bytes = txn
            .get_cf(StateMachineColumns::TaskAssignments.cf(db), task_ids_key)
            .map_err(|e| StateMachineError::TransactionError(e.to_string()))?;

        let task_ids: Vec<String> = task_ids_bytes
            .map(|task_id_bytes| {
                JsonEncoder::decode(&task_id_bytes)
                    .map_err(StateMachineError::from)
                    .unwrap_or_else(|e| {
                        error!("Failed to deserialize task id: {}", e);
                        Vec::new()
                    })
            })
            .unwrap_or_else(Vec::new);

        let limit = limit.unwrap_or(task_ids.len() as u64) as usize;

        let tasks: Result<Vec<indexify_internal_api::Task>, StateMachineError> = task_ids
            .into_iter()
            .take(limit)
            .map(|task_id| {
                let task_bytes = txn
                    .get_cf(StateMachineColumns::Tasks.cf(db), task_id.as_bytes())
                    .map_err(|e| StateMachineError::TransactionError(e.to_string()))?
                    .ok_or_else(|| {
                        StateMachineError::DatabaseError(format!("Task {} not found", task_id))
                    })?;
                JsonEncoder::decode(&task_bytes).map_err(StateMachineError::from)
            })
            .collect();
        tasks
    }

    pub async fn get_executors_from_ids(
        &self,
        executor_ids: HashSet<String>,
        db: &Arc<OptimisticTransactionDB>,
    ) -> Result<Vec<indexify_internal_api::ExecutorMetadata>, StateMachineError> {
        let txn = db.transaction();
        let executors: Result<Vec<indexify_internal_api::ExecutorMetadata>, StateMachineError> =
            executor_ids
                .into_iter()
                .map(|executor_id| {
                    let executor_bytes = txn
                        .get_cf(
                            StateMachineColumns::Executors.cf(db),
                            executor_id.as_bytes(),
                        )
                        .map_err(|e| StateMachineError::TransactionError(e.to_string()))?
                        .ok_or_else(|| {
                            StateMachineError::DatabaseError(format!(
                                "Executor {} not found",
                                executor_id
                            ))
                        })?;
                    JsonEncoder::decode(&executor_bytes).map_err(StateMachineError::from)
                })
                .collect();
        executors
    }

    pub async fn get_content_from_ids(
        &self,
        content_ids: HashSet<String>,
        db: &Arc<OptimisticTransactionDB>,
    ) -> Result<Vec<indexify_internal_api::ContentMetadata>, StateMachineError> {
        let txn = db.transaction();
        let content: Result<Vec<indexify_internal_api::ContentMetadata>, StateMachineError> =
            content_ids
                .into_iter()
                .map(|content_id| {
                    let content_bytes = txn
                        .get_cf(
                            StateMachineColumns::ContentTable.cf(db),
                            content_id.as_bytes(),
                        )
                        .map_err(|e| StateMachineError::TransactionError(e.to_string()))?
                        .ok_or_else(|| {
                            StateMachineError::DatabaseError(format!(
                                "Content {} not found",
                                content_id
                            ))
                        })?;
                    serde_json::from_slice(&content_bytes).map_err(StateMachineError::from)
                })
                .collect();
        content
    }
}