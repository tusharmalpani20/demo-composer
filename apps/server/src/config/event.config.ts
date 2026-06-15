import { EventEmitter } from "eventemitter3";

type ApplicationEvents = Record<never, never>;

export const event_emitter = new EventEmitter<ApplicationEvents>();

export const initialize_event_emitter = () => {
    return event_emitter;
};
