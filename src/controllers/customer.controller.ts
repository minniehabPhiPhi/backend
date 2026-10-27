import type { Request, Response } from "express";
import { CustomerRepository } from "../repositories/customer.repository";
import type { CustomerPostRequest } from "../models/customer.model";

export async function getCustomers(req: Request, res: Response) {
  const search = req.query.search as string | undefined;
  res.status(200).json(await CustomerRepository.findAll(search));
}

export async function getNearbyCustomers(req: Request, res: Response) {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);
  const radius = parseFloat((req.query.radius as string) || "1");
  if (isNaN(lat) || isNaN(lng)) {
    res.status(400).json({ error: "Missing required query params: lat, lng" });
    return;
  }
  res.status(200).json(await CustomerRepository.findNearby(lat, lng, radius));
}

export async function createCustomer(req: Request<{}, unknown, CustomerPostRequest>, res: Response) {
  const result = await CustomerRepository.create(req.body);
  res.status(201).json({ affected_row: result.affectedRows, last_idx: result.insertId });
}

export async function updateCustomer(req: Request<{ id: string }, unknown, CustomerPostRequest>, res: Response) {
  const result = await CustomerRepository.update(req.params.id, req.body);
  res.status(200).json({ affected_row: result.affectedRows });
}

export async function deleteCustomer(req: Request<{ id: string }>, res: Response) {
  const result = await CustomerRepository.delete(req.params.id);
  res.status(200).json({ affected_row: result.affectedRows });
}
