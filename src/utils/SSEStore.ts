import { Response } from "express";

// need to understand this 


class SSEStore {
  private clients: Map<string, Response> = new Map();

  // store admin connection
  addClient(adminId: string, res: Response) {
    this.clients.set(adminId, res);
  }

  // remove admin connection
  removeClient(adminId: string) {
    this.clients.delete(adminId);
  }

  // get specific admin connection
  getClient(adminId: string) {
    return this.clients.get(adminId);
  }

  // (optional) get all admins
  getAllClients() {
    return this.clients;
  }
}

export const sseStore = new SSEStore();
