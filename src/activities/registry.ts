import type { LearningObject } from '@/types/learningObject';
import type { ActivityDefinition, ActivityRegistry } from '@/types/activity';

class ActivityRegistryImpl implements ActivityRegistry {
  private readonly _map = new Map<string, ActivityDefinition>();

  register<T extends LearningObject>(def: ActivityDefinition<T>): void {
    this._map.set(def.type, def);
  }

  get(type: string): ActivityDefinition | undefined {
    return this._map.get(type);
  }

  types(): string[] {
    return [...this._map.keys()];
  }
}

/** Singleton registry. Activities self-register by importing their module. */
export const activityRegistry: ActivityRegistry = new ActivityRegistryImpl();
