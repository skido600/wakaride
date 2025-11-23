import type { Response } from "express";

type HandleResponseType = (
  res: Response,
  success: boolean,
  statuscode: number,
  message: string | any[],
  data?: unknown
) => void;

const HandleResponse: HandleResponseType = (
  res,
  success,
  statuscode,
  message,
  data
): void => {
  const response: any = { success, statuscode, message };

  if (data !== undefined) {
    response.data = data;
  }

  res.status(statuscode).json(response);
};

export { HandleResponse };