import { vi } from 'vitest';

function createModelMock() {
    return {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        createMany: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
        upsert: vi.fn(),
        aggregate: vi.fn(),
        count: vi.fn(),
    };
}

type ModelMock = ReturnType<typeof createModelMock>;

// A Proxy so any `prismaMock.<model>.<method>()` "just works" as a vi.fn(),
// without having to hand-declare every Prisma model used across the app.
export const prismaMock = new Proxy({} as Record<string, ModelMock>, {
    get(target, prop: string) {
        if (!target[prop]) target[prop] = createModelMock();
        return target[prop];
    },
});

export function resetPrismaMock() {
    for (const model of Object.values(prismaMock as Record<string, ModelMock>)) {
        for (const fn of Object.values(model)) {
            (fn as ReturnType<typeof vi.fn>).mockReset();
        }
    }
}

export default prismaMock;
