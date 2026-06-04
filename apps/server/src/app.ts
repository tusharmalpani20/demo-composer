import cookie from '@fastify/cookie';
import fastifyCors from "@fastify/cors";
import fastifyMultipart from "@fastify/multipart";
import fastifySwagger from '@fastify/swagger';
import fastifyApiReference from "@scalar/fastify-api-reference";
import fastify, { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { jsonSchemaTransform, serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import fs from "fs";
import { pipeline } from "stream";
import { ulid } from "zod";
import { common_temp_folder } from "./common/constants/common.constant.js";
import { error_handler } from './common/helper_function/error_handler.helper.js';
import { cookieConfig } from "./config/cookie.config.js";
import { initialize_event_emitter } from './config/event.config.js';
import requestDec from './config/fastify_decoder.config.js';
import { configure_passport } from './config/passport.config.js';
import { build_first_run_setup_routes } from './modules/setup/first-run-setup.routes.js';
import { index_root_routes } from './root_router/index.root_router.js';

type BuildOptions = Parameters<typeof fastify>[0] & {
  first_run_setup_service?: Parameters<typeof build_first_run_setup_routes>[0];
};

export const build = (opts: BuildOptions = {}) => {
  const { first_run_setup_service, ...fastify_options } = opts;
  const app = fastify(fastify_options);

  // Register request decorators first
  app.register(requestDec);

  // Register CORS
  app.register(fastifyCors, {
      origin: (origin, cb) => {
          const allowedWebOrigins = [
              'http://localhost:3000',
              'http://localhost:4000',
          ];

          // In development, allow all origins
          if (process.env.NODE_ENV !== 'production') {
              return cb(null, true);
          }

          // In production, allow requests with no origin (mobile apps)
          if (!origin) {
              return cb(null, true);
          }

          // In production, check against allowed origins
          const allowed = allowedWebOrigins.includes(origin);
          if (allowed) {
              return cb(null, true);
          } else {
              console.log('Blocked origin:', origin);
              // Return null instead of an Error to prevent the error from being logged
              return cb(null, false);
          }
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      preflight: true,
      preflightContinue: false
  });

  // Register cookie plugin here, after CORS but before other plugins
  app.register(cookie, cookieConfig);

  // Register Multipart right after CORS
  app.register(fastifyMultipart, {
      limits: {
          fileSize: 1024 * 1024 * 1024, // 1GB
          files: 10
      },
      attachFieldsToBody: true,
      onFile: async (part: any) => {

          // console.log(part.fields);
          const file_id = ulid();
          const file_extension = part.filename.split('.').pop();
          const uniqueName = `${file_id}.${file_extension}`;
          const tempPath = `./${common_temp_folder}/${uniqueName}`;
          console.log(part.mimetype);
          try {
              await pipeline(part.file, fs.createWriteStream(tempPath));
              (part as any).filepath = tempPath;
              (part as any).generated_file_name = uniqueName;
              (part as any).file_extension = file_extension;
              (part as any).file_id = file_id;
              console.log("File saved to:", tempPath);
          } catch (err) {
              console.error("Error saving file:", err);
              throw err;
          }
      }
  });

  app.setErrorHandler(async (error: FastifyError, request: FastifyRequest, response: FastifyReply) => {
      error_handler(error, request, response)
  });

  // Then register authentication/security plugins
  configure_passport(app);

  // Set up Zod as the validator and serializer
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Register Swagger
  app.register(fastifySwagger, {
      openapi: {
          info: {
              title: 'ORCA',
              description: 'ORCA',
              version: '1.0.0'
          },
          // Add security schemes definition
          components: {
              securitySchemes: {
                  bearerAuth: {
                      type: 'http',
                      scheme: 'bearer',
                      bearerFormat: 'JWT',
                      description: 'Enter your JWT token'
                  }
              },
          },

          tags: [
              { name: 'authentication', description: 'Authentication related end-points' }
          ],
          servers: [
              {
                  url: 'http://localhost:4000/api/v1',
                  description: 'Development server'
              }
          ],
      },
      transform: jsonSchemaTransform,
  });


  // Register Scalar API Reference
  if (process.env.DEV_TYPE === "development") {
      app.register(fastifyApiReference, {
          routePrefix: '/documentation',
          configuration: {
              //title: 'ORCA API Documentation',
              theme: 'bluePlanet', //'alternate' | 'default' | 'moon' | 'purple' | 'solarized' | 'bluePlanet' | 'deepSpace' | 'saturn' | 'kepler' | 'mars' | 'none';
              spec: {
                  content: () => app.swagger(),
              },
              metaData: {
                  title: 'DEMO COMPOSER API Documentation',
                  description: 'DEMO COMPOSER API Documentation',
                  ogDescription: 'DEMO COMPOSER API Documentation',
                  ogTitle: 'DEMO COMPOSER API Documentation',
                  // ogImage: 'https://example.com/image.png',
                  // twitterCard: 'summary_large_image',
                  // // Add more...
              },

          },
      });


      // app.register(fastifySwaggerUi, {
      //     routePrefix: '/documentation',
      //     uiConfig: {
      //         docExpansion: 'full',
      //         deepLinking: false
      //     },
      //     uiHooks: {
      //         onRequest: function (request, reply, next) { next() },
      //         preHandler: function (request, reply, next) { next() }
      //     },
      //     staticCSP: true,
      //     transformStaticCSP: (header) => header,
      //     transformSpecification: (swaggerObject, request, reply) => { return swaggerObject },
      //     transformSpecificationClone: true
      // })
  }

  initialize_event_emitter();

  // Register routes
  app.register(index_root_routes, {
      prefix: "/api/v1"
  });

  if (first_run_setup_service) {
      app.register(build_first_run_setup_routes(first_run_setup_service), {
          prefix: "/api/v1/setup",
      });
  }

  return app;
};
