import { EventEmitter } from "eventemitter3";
import { Application_Events_Interface } from "../common/constants/event.constant";

export const event_emitter = new EventEmitter<Application_Events_Interface>();

export const initialize_event_emitter = () => {
    try {

    } catch (error) {
        console.error("Error initializing event emitter:", error);
        throw error;
    }
}