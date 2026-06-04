import type { User_Asset_Type } from "@repo/types";

export interface Application_Events_Interface {
    user_profile_picture_upload: (
        user_asset: User_Asset_Type,
        temp_file_path: string
    ) => void;
    // // File Events
    // 'file_storage': (file: File_Type, generated_file_name: string, immediate_cleanup: boolean) => void;

    // // File Thumbnail Events
    // 'generate_image_file_thumbnail': (file_version: File_Version_Type, generated_file_name: string, organization_user: Organization_User_Type) => void;

    // // Project Events
    // 'project_create': (project: Project_Type, organization_user: Organization_User_Type) => void;
    // 'project_update': (project: Project_Type, old_project: Project_Type, organization_user: Organization_User_Type) => void;
    // 'project_delete': (project: Project_Type, organization_user: Organization_User_Type) => void;
    // 'project_status_update': (project: Project_Type, old_project: Project_Type, organization_user: Organization_User_Type) => void;

    // //Project File Events
    // 'project_file_upload': (file: File_Type, project: Project_Type, organization_user: Organization_User_Type) => void;

    // // Project User Events
    // 'project_user_create': (project_user_detail: Project_User_Type, added_user_detail: Organization_User_Type, organization_user: Organization_User_Type) => void;
    // 'project_user_update': (project_user: Project_User_Type, old_project_user: Project_User_Type, organization_user: Organization_User_Type) => void;
    // 'project_user_delete': (project_user_detail: Project_User_Type, organization_user: Organization_User_Type) => void;

    // // Project Area Events
    // 'project_area_create_multiple': (project_area: Project_Area_Type[], project: Project_Type, organization_user: Organization_User_Type) => void;
    // 'project_area_create': (project_area: Project_Area_Type, organization_user: Organization_User_Type) => void;
    // 'project_area_update': (project_area: Project_Area_Type, old_project_area: Project_Area_Type, organization_user: Organization_User_Type) => void;
    // 'project_area_delete': (project_area: Project_Area_Type, organization_user: Organization_User_Type) => void;

    // // Project Area Assignment Events
    // 'project_area_assignment_create': (project_area_assignment: Project_Area_Assignment_Type, organization_user: Organization_User_Type) => void;
    // 'project_area_assignment_delete': (project_area_assignment: Project_Area_Assignment_Type, organization_user: Organization_User_Type) => void;

    // // Task Events
    // 'task_create': (task: Task_Type, organization_user: Organization_User_Type) => void;
    // 'task_update': (task: Task_Type, old_task: Task_Type, organization_user: Organization_User_Type) => void;
    // 'task_delete': (task: Task_Type, organization_user: Organization_User_Type) => void;
    // 'task_status_update': (task: Task_Type, old_task: Task_Type, organization_user: Organization_User_Type) => void;

    // //Task Assignment Events
    // 'task_assignment_create': (task_assignment: Task_Assignment_Type, organization_user: Organization_User_Type) => void;
    // 'task_assignment_delete': (task_assignment: Task_Assignment_Type, organization_user: Organization_User_Type) => void;


    // //Task File Upload Events
    // 'task_file_upload': (file: File_Type, task: Task_Type, organization_user: Organization_User_Type) => void;


    // // Storage Events
    // 'storage_usage_calculate': (file: File_Type, node: File_System_Type, organization_user: Organization_User_Type) => void;
    // 'storage_usage_calculate_on_file_delete': (file: File_Type, node: File_System_Type, organization_user: Organization_User_Type) => void;

    // // User Asset Events
    // 'user_profile_picture_upload': (user_asset: User_Asset_Type, temp_file_path: string) => void;


    // 'sheet_thumbnail_generate': (sheet: Sheet_Type, file: File_Type, generated_file_name: string, organization_user: Organization_User_Type) => void;

    // //authentication events
    // 'send_whatsapp_otp_for_signup': (send_to: string, otp_code: string) => void;

    // //organization events
    // 'send_organization_user_invitation_to_user_via_whatsapp': (
    //     organization_user_invitation_list: Organization_User_Invitation_Type[],
    //     invited_by_user: Organization_User_Type
    // ) => void;

    // //typesense events
    // 'typesense_create_multiple_entry': (typesense_schema: Typesense_Schema_Type, data: any[], organization_user: Organization_User_Type) => void;
    // 'typesense_create_entry': (typesense_schema: Typesense_Schema_Type, data: any, organization_user: Organization_User_Type) => void;
    // 'typesense_update_entry': (typesense_schema: Typesense_Schema_Type, data: any, organization_user: Organization_User_Type) => void;
    // 'typesense_delete_entry': (typesense_schema: Typesense_Schema_Type, data: any, organization_user: Organization_User_Type) => void;
}


export const Event_Emitter_Events = {
    User_Asset_Events: {
        user_profile_picture_upload: "user_profile_picture_upload" as const,
    },
    // File_Events: {
    //     file_storage: "file_storage" as const,
    //     generate_image_file_thumbnail: "generate_image_file_thumbnail" as const
    // },
    // Project_Events: {
    //     project_create: "project_create" as const,
    //     project_update: "project_update" as const,
    //     project_delete: "project_delete" as const,
    //     project_status_update: "project_status_update" as const
    // },
    // Project_File_Events: {
    //     project_file_upload: "project_file_upload" as const
    // },
    // Project_User_Events: {
    //     project_user_create: "project_user_create" as const,
    //     project_user_update: "project_user_update" as const,
    //     project_user_delete: "project_user_delete" as const
    // },
    // Project_Area_Events: {
    //     project_area_create_multiple: "project_area_create_multiple" as const,
    //     project_area_create: "project_area_create" as const,
    //     project_area_update: "project_area_update" as const,
    //     project_area_delete: "project_area_delete" as const
    // },
    // Project_Area_Assignment_Events: {
    //     project_area_assignment_create: "project_area_assignment_create",
    //     project_area_assignment_update: "project_area_assignment_update",
    //     project_area_assignment_delete: "project_area_assignment_delete"
    // },
    // Task_Events: {
    //     task_create: "task_create" as const,
    //     task_update: "task_update" as const,
    //     task_delete: "task_delete" as const,
    //     task_status_update: "task_status_update" as const
    // },
    // Task_Assignment_Events: {
    //     task_assignment_create: "task_assignment_create" as const,
    //     task_assignment_delete: "task_assignment_delete" as const
    // },
    // Task_File_Events: {
    //     task_file_upload: "task_file_upload" as const
    // },
    // Client_Events: {
    //     client_create: "client_create" as const,
    //     client_update: "client_update" as const,
    //     client_delete: "client_delete" as const
    // },
    // Storage_Events: {
    //     storage_usage_calculate: "storage_usage_calculate" as const,
    //     storage_usage_calculate_on_file_delete: "storage_usage_calculate_on_file_delete" as const
    // },
    // User_Asset_Events: {
    //     user_profile_picture_upload: "user_profile_picture_upload" as const
    // },
    // Sheet_Events: {
    //     sheet_group_thumbnail_generate: "sheet_thumbnail_generate" as const
    // },
    // Authentication_Events: {
    //     send_whatsapp_otp_for_signup: "send_whatsapp_otp_for_signup" as const
    // },
    // Organization_Events: {
    //     send_organization_user_invitation_to_user_via_whatsapp: "send_organization_user_invitation_to_user_via_whatsapp" as const,
    // },
    // Typesense_Events: {
    //     typesense_create_multiple_entry: "typesense_create_multiple_entry" as const,
    //     typesense_create_entry: "typesense_create_entry" as const,
    //     typesense_update_entry: "typesense_update_entry" as const,
    //     typesense_delete_entry: "typesense_delete_entry" as const
    // }
} as const;