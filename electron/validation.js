import { z } from 'zod';

const idSchema = z.string().min(1);
const timestampSchema = z.number().int().nonnegative();

export const schemas = {
  projectCreate: z.object({
    id: idSchema,
    name: z.string().min(1),
    description: z.string().optional().nullable(),
    createdAt: timestampSchema,
  }),
  projectList: z.undefined().optional(),
  projectUpdate: z.object({
    id: idSchema,
    updates: z.object({
      name: z.string().min(1).optional(),
      description: z.string().optional().nullable(),
    }).refine((value) => Object.keys(value).length > 0, {
      message: 'No updates provided',
    }),
  }),
  projectDelete: z.object({ id: idSchema }),
  projectId: z.object({ projectId: idSchema }),

  taskCreate: z.object({
    id: idSchema,
    projectId: idSchema,
    title: z.string().min(1),
    description: z.string().optional().nullable(),
    status: z.enum(['backlog', 'in-progress', 'done']),
    priority: z.enum(['low', 'medium', 'high']),
    createdAt: timestampSchema,
    position: z.number().int().optional().nullable(),
  }),
  taskUpdate: z.object({
    id: idSchema,
    updates: z.object({
      title: z.string().min(1).optional(),
      description: z.string().optional().nullable(),
      status: z.enum(['backlog', 'in-progress', 'done']).optional(),
      priority: z.enum(['low', 'medium', 'high']).optional(),
      position: z.number().int().optional().nullable(),
    }).refine((value) => Object.keys(value).length > 0, {
      message: 'No updates provided',
    }),
  }),
  taskDelete: z.object({ id: idSchema }),

  issueCreate: z.object({
    id: idSchema,
    projectId: idSchema,
    title: z.string().min(1),
    description: z.string().optional().nullable(),
    status: z.enum(['todo', 'in-progress', 'done']),
    priority: z.enum(['low', 'medium', 'high']),
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
  }),
  issueUpdate: z.object({
    id: idSchema,
    updates: z.object({
      title: z.string().min(1).optional(),
      description: z.string().optional().nullable(),
      status: z.enum(['todo', 'in-progress', 'done']).optional(),
      priority: z.enum(['low', 'medium', 'high']).optional(),
    }).refine((value) => Object.keys(value).length > 0, {
      message: 'No updates provided',
    }),
  }),
  issueDelete: z.object({ id: idSchema }),

  wikiCreate: z.object({
    id: idSchema,
    projectId: idSchema,
    title: z.string().min(1),
    content: z.string().min(1),
    parentId: idSchema.nullable().optional(),
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
    position: z.number().int().optional().nullable(),
  }),
  wikiUpdate: z.object({
    id: idSchema,
    updates: z.object({
      title: z.string().min(1).optional(),
      content: z.string().min(1).optional(),
      parentId: idSchema.nullable().optional(),
      position: z.number().int().optional().nullable(),
    }).refine((value) => Object.keys(value).length > 0, {
      message: 'No updates provided',
    }),
  }),
  wikiDelete: z.object({ id: idSchema }),

  memoCreate: z.object({
    id: idSchema,
    projectId: idSchema,
    title: z.string().min(1),
    content: z.string(),
    createdAt: timestampSchema,
    updatedAt: timestampSchema.nullable().optional(),
  }),
  memoUpdate: z.object({
    id: idSchema,
    updates: z.object({
      title: z.string().min(1).optional(),
      content: z.string().optional(),
      updatedAt: timestampSchema.nullable().optional(),
    }).refine((value) => Object.keys(value).length > 0, {
      message: 'No updates provided',
    }),
  }),
  memoDelete: z.object({ id: idSchema }),
};

export const parseInput = (schema, input) => {
  const result = schema.safeParse(input);
  if (!result.success) {
    return {
      ok: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: result.error.flatten(),
      },
    };
  }
  return { ok: true, data: result.data };
};
