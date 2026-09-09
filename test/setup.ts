import { vi } from 'vitest';

// discord-logify posts to a real Discord webhook when instantiated/used.
// Mock it globally so no test ever fires a real network request.
vi.mock('discord-logify', () => {
    class log {
        Error = vi.fn();
        Alert = vi.fn();
        Info = vi.fn();
        Warn = vi.fn();
    }
    return { log };
});
