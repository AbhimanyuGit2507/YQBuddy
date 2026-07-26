import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class BodySizeMiddleware implements NestMiddleware {
  private readonly maxSize: number;

  constructor(maxSizeBytes: number = 1024 * 1024) {
    this.maxSize = maxSizeBytes;
  }

  use(req: Request, res: Response, next: NextFunction) {
    const contentLength = req.headers['content-length'];
    if (contentLength && parseInt(contentLength, 10) > this.maxSize) {
      res.status(413).json({
        message: `Request body too large. Maximum size is ${this.maxSize / 1024}KB`,
      });
      return;
    }
    next();
  }
}
