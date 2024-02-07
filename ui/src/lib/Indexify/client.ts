import axios, { AxiosInstance, AxiosResponse } from "axios";
import Repository from "./repository";
import Extractor from "./extractor";
import { IExtractor, IRepository, ITask } from "./types";

const DEFAULT_SERVICE_URL = "http://localhost:8900"; // Set your default service URL

class IndexifyClient {
  private serviceUrl: string;
  private client: AxiosInstance;

  constructor(serviceUrl: string = DEFAULT_SERVICE_URL) {
    this.serviceUrl = serviceUrl;
    this.client = axios.create({
      baseURL: serviceUrl,
    });
  }

  async repositories(): Promise<Repository[]> {
    const response = await this.client.get("repositories");
    const repositoriesData = response.data.repositories as IRepository[];
    return repositoriesData.map(
      (data) => new Repository(this.serviceUrl, data.name)
    );
  }

  async getRepository(name: string): Promise<Repository> {
    const response = await this.client.get(`repositories/${name}`);
    const data = response.data.repository as IRepository;
    return new Repository(this.serviceUrl, data.name, data.extractor_bindings);
  }

  async extractors(): Promise<Extractor[]> {
    const response = await this.client.get("extractors");
    const extractorsData = response.data.extractors as IExtractor[];
    return extractorsData.map((data) => new Extractor(data));
  }
}

export default IndexifyClient;
