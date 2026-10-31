import { Request, Response } from "express";
import { PlansService } from "./plans.service.js";
import { sendSuccess } from "../../common/utils/response-envelope.js";

export class PlansController {
  // Plans
  static async listPlans(req: Request, res: Response): Promise<void> {
    const isActiveOnly = req.query["active"] === "true";
    const plans = await PlansService.listPlans(isActiveOnly);
    sendSuccess(res, plans, 200, undefined, req);
  }

  static async getPlan(req: Request, res: Response): Promise<void> {
    const plan = await PlansService.getPlanById(req.params["id"]!);
    sendSuccess(res, plan, 200, undefined, req);
  }

  static async createPlan(req: Request, res: Response): Promise<void> {
    const plan = await PlansService.createPlan(req.body);
    sendSuccess(res, plan, 201, undefined, req);
  }

  static async updatePlan(req: Request, res: Response): Promise<void> {
    const plan = await PlansService.updatePlan(req.params["id"]!, req.body);
    sendSuccess(res, plan, 200, undefined, req);
  }

  static async deletePlan(req: Request, res: Response): Promise<void> {
    await PlansService.deletePlan(req.params["id"]!);
    sendSuccess(res, { message: "Plan removed successfully." }, 200, undefined, req);
  }

  // Taxes
  static async listTaxRules(req: Request, res: Response): Promise<void> {
    const rules = await PlansService.listTaxRules();
    sendSuccess(res, rules, 200, undefined, req);
  }

  static async createTaxRule(req: Request, res: Response): Promise<void> {
    const rule = await PlansService.createTaxRule(req.body);
    sendSuccess(res, rule, 201, undefined, req);
  }

  static async updateTaxRule(req: Request, res: Response): Promise<void> {
    const rule = await PlansService.updateTaxRule(req.params["id"]!, req.body);
    sendSuccess(res, rule, 200, undefined, req);
  }

  // Discounts
  static async listDiscountRules(req: Request, res: Response): Promise<void> {
    const rules = await PlansService.listDiscountRules();
    sendSuccess(res, rules, 200, undefined, req);
  }

  static async createDiscountRule(req: Request, res: Response): Promise<void> {
    const rule = await PlansService.createDiscountRule(req.body);
    sendSuccess(res, rule, 201, undefined, req);
  }

  static async updateDiscountRule(req: Request, res: Response): Promise<void> {
    const rule = await PlansService.updateDiscountRule(req.params["id"]!, req.body);
    sendSuccess(res, rule, 200, undefined, req);
  }
}
