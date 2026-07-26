"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const nestjs_pino_1 = require("nestjs-pino");
const app_module_1 = require("./app.module");
const redis_io_adapter_1 = require("./redis/redis-io.adapter");
const all_exceptions_filter_1 = require("./all-exceptions.filter");
const env_validation_1 = require("./config/env.validation");
const body_size_middleware_1 = require("./common/middleware/body-size.middleware");
async function bootstrap() {
    const envValidation = new env_validation_1.EnvValidation();
    envValidation.validate();
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { bufferLogs: true });
    const redisIoAdapter = new redis_io_adapter_1.RedisIoAdapter(app);
    await redisIoAdapter.connectToRedis();
    app.useWebSocketAdapter(redisIoAdapter);
    app.useLogger(app.get(nestjs_pino_1.Logger));
    app.use((0, helmet_1.default)());
    app.use((0, cookie_parser_1.default)());
    app.use(new body_size_middleware_1.BodySizeMiddleware(1024 * 1024).use.bind(new body_size_middleware_1.BodySizeMiddleware()));
    app.enableCors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3001',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    });
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    app.useGlobalFilters(new all_exceptions_filter_1.AllExceptionsFilter());
    const server = await app.listen(process.env.PORT ?? 3000);
    process.on('SIGTERM', () => {
        console.log('SIGTERM received, shutting down gracefully...');
        server.close(() => {
            console.log('Server closed');
            process.exit(0);
        });
    });
    process.on('SIGINT', () => {
        console.log('SIGINT received, shutting down gracefully...');
        server.close(() => {
            console.log('Server closed');
            process.exit(0);
        });
    });
}
bootstrap();
//# sourceMappingURL=main.js.map