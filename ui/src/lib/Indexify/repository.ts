import axios, { AxiosInstance } from "axios";
import { IContent, IExtractorBinding, IIndex, ITask } from "./types";
class Repository {
  private serviceUrl: string;
  public name: string;
  public extractorBindings: IExtractorBinding[];
  public filters: Record<string, string>;
  private client: AxiosInstance;

  constructor(
    serviceUrl: string,
    name: string,
    extractorBindings: IExtractorBinding[] = [],
    filters: Record<string, string> = {}
  ) {
    this.client = axios.create({ baseURL: serviceUrl });
    this.serviceUrl = serviceUrl;
    this.name = name;
    this.extractorBindings = extractorBindings;
    this.filters = filters;
  }

  async indexes(): Promise<IIndex[]> {
    const resp = await axios.get(
      `${this.serviceUrl}/repositories/${this.name}/indexes`
    );
    return resp.data.indexes;
  }

  async getContent(
    parent_id?: string,
    labels_eq?: string
  ): Promise<IContent[]> {
    const resp = await axios.get(
      `${this.serviceUrl}/repositories/${this.name}/content`,
      {
        params: { parent_id, labels_eq },
      }
    );
    return resp.data.content_list;
  }

  async getTasks(extractor_binding: string): Promise<ITask[]> {
    return this.client
      .get("tasks", {
        params: {
          repository: this.name,
          extractor_binding,
        },
      })
      .then((res) => res.data.tasks);
  }
}

export default Repository;
