export const general_error_message = {
    database_connection_error: {
        code: 500,
        type: "database_connection_error",
        message: "Database connection error"
    },
    forbidden_error: {
        code: 403,
        type: "forbidden_error",
        message: "Forbidden"
    },
    not_found_error: {
        code: 404,
        type: "not_found_error",
        message: "The resource with the given id is not found"
    },
    unauthorized_error: {
        code: 401,
        type: "unauthorized_error",
        message: "Unauthorized"
    },
    request_not_found: {
        code: 404,
        type: "request_not_found",
        message: "The request is not found"
    },
    validation_error: {
        code: 400,
        type: "validation_error",
        message: "The request is not valid"
    },
    update_conflict_error: {
        code: 409,
        type: "update_conflict_error",
        message: "The given document has been modified by another user. Please refresh the document and try again."
    },
    default_error: {
        code: 500,
        type: "default_error",
        message: "Internal server error"
    },
    internal_server_error: {
        code: 500,
        type: "internal_server_error",
        message: "Internal server error"
    }
};

export const user_error_message = {
    not_found: {
        code: 404,
        type: "not_found",
        message: "The user with the given id is not found"
    },
    email_already_in_use: {
        code: 400,
        type: "email_already_in_use",
        message: "The email is already in use"
    },
    password_already_set: {
        code: 400,
        type: "password_already_set",
        message: "The password is already set"
    },
    password_not_set: {
        code: 400,
        type: "password_not_set",
        message: "The password is not set"
    },
    password_incorrect: {
        code: 400,
        type: "password_incorrect",
        message: "The password is incorrect"
    }
};

export const authentication_error_message = {
    invalid_password_or_username: {
        code: 401,
        type: "invalid_password_or_username",
        message: "Invalid password or username"
    },
    invalid_otp_token: {
        code: 401,
        type: "invalid_otp_token",
        message: "Invalid OTP token"
    },
    invalid_otp_code: {
        code: 401,
        type: "invalid_otp_code",
        message: "Invalid OTP code"
    },
    otp_already_verified: {
        code: 400,
        type: "otp_already_verified",
        message: "OTP already verified"
    },
    otp_expired: {
        code: 400,
        type: "otp_expired",
        message: "OTP expired"
    },
    otp_not_found: {
        code: 404,
        type: "otp_not_found",
        message: "OTP not found"
    }
};


export const organization_role_error_message = {
    name_already_in_use: {
        code: 400,
        type: "name_already_in_use",
        message: "The role name is already in use"
    },
    not_found: {
        code: 404,
        type: "not_found",
        message: "The role with the given id is not found"
    }
};

export const organization_department_error_message = {
    name_already_in_use: {
        code: 400,
        type: "name_already_in_use",
        message: "The department name is already in use"
    },
    not_found: {
        code: 404,
        type: "not_found",
        message: "The department with the given id is not found"
    }
};

export const organization_designation_error_message = {
    name_already_in_use: {
        code: 400,
        type: "name_already_in_use",
        message: "The designation name is already in use"
    },
    not_found: {
        code: 404,
        type: "not_found",
        message: "The designation with the given id is not found"
    }
};

export const organization_branch_error_message = {
    name_already_in_use: {
        code: 400,
        type: "name_already_in_use",
        message: "The branch name is already in use"
    },
    not_found: {
        code: 404,
        type: "not_found",
        message: "The branch with the given id is not found"
    }
};

export const organization_error_message = {
    not_found: {
        code: 404,
        type: "not_found",
        message: "The organization with the given id is not found"
    }
};

export const session_organization_error_message = {
    organization_mismatch: {
        code: 400,
        type: "organization_mismatch",
        message: "The selected organization does not match your account"
    }
};

export const contact_error_message = {
    not_found: {
        code: 404,
        type: "not_found",
        message: "The contact with the given id was not found"
    }
};

export const item_error_message = {
    name_already_in_use: {
        code: 400,
        type: "name_already_in_use",
        message: "The item name is already in use"
    },
    not_found: {
        code: 404,
        type: "not_found",
        message: "The item with the given id is not found"
    }
};

export const brand_error_message = {
    name_already_in_use: {
        code: 400,
        type: "name_already_in_use",
        message: "The brand name is already in use"
    },
    not_found: {
        code: 404,
        type: "not_found",
        message: "The brand with the given id is not found"
    }
};

export const category_error_message = {
    name_already_in_use: {
        code: 400,
        type: "name_already_in_use",
        message: "The category name is already in use"
    },
    not_found: {
        code: 404,
        type: "not_found",
        message: "The category with the given id is not found"
    }
};

export const uom_error_message = {
    name_already_in_use: {
        code: 400,
        type: "name_already_in_use",
        message: "The UOM name is already in use"
    },
    not_found: {
        code: 404,
        type: "not_found",
        message: "The UOM with the given id is not found"
    }
};

export const specification_catalog_error_message = {
    name_already_in_use: {
        code: 400,
        type: "name_already_in_use",
        message: "The specification catalog name is already in use"
    },
    code_already_in_use: {
        code: 400,
        type: "code_already_in_use",
        message: "The specification catalog code is already in use"
    },
    not_found: {
        code: 404,
        type: "not_found",
        message: "The specification catalog with the given id is not found"
    }
};

export const specification_alias_error_message = {
    alias_already_in_use: {
        code: 400,
        type: "alias_already_in_use",
        message: "The specification alias is already in use"
    },
    not_found: {
        code: 404,
        type: "not_found",
        message: "The specification alias with the given id is not found"
    }
};

export const uom_alias_error_message = {
    alias_already_in_use: {
        code: 400,
        type: "alias_already_in_use",
        message: "The UOM alias is already in use"
    },
    not_found: {
        code: 404,
        type: "not_found",
        message: "The UOM alias with the given id is not found"
    }
};

export const item_alias_error_message = {
    alias_already_in_use: {
        code: 400,
        type: "alias_already_in_use",
        message: "The item alias is already in use"
    },
    not_found: {
        code: 404,
        type: "not_found",
        message: "The item alias with the given id is not found"
    }
};

export const item_brand_error_message = {
    already_linked: {
        code: 400,
        type: "already_linked",
        message: "This brand is already linked to the item"
    },
    not_found: {
        code: 404,
        type: "not_found",
        message: "The item brand link with the given id is not found"
    }
};

export const item_category_error_message = {
    already_linked: {
        code: 400,
        type: "already_linked",
        message: "This category is already linked to the item"
    },
    not_found: {
        code: 404,
        type: "not_found",
        message: "The item category link with the given id is not found"
    }
};

export const item_uom_error_message = {
    already_linked: {
        code: 400,
        type: "already_linked",
        message: "This UOM is already linked to the item"
    },
    not_found: {
        code: 404,
        type: "not_found",
        message: "The item UOM with the given id is not found"
    }
};

export const item_specification_error_message = {
    already_linked: {
        code: 400,
        type: "already_linked",
        message: "This specification is already linked to the item"
    },
    not_found: {
        code: 404,
        type: "not_found",
        message: "The item specification with the given id is not found"
    }
};

export const vendor_error_message = {
    name_already_in_use: {
        code: 400,
        type: "name_already_in_use",
        message: "The vendor name is already in use"
    },
    not_found: {
        code: 404,
        type: "not_found",
        message: "The vendor with the given id is not found"
    }
};

export const vendor_contact_error_message = {
    not_found: {
        code: 404,
        type: "not_found",
        message: "The vendor contact with the given id is not found"
    }
};

export const vendor_contact_channel_error_message = {
    not_found: {
        code: 404,
        type: "not_found",
        message: "The vendor contact channel with the given id is not found"
    }
};

export const vendor_supported_brand_error_message = {
    already_linked: {
        code: 400,
        type: "already_linked",
        message: "This brand is already linked to the vendor"
    },
    not_found: {
        code: 404,
        type: "not_found",
        message: "The vendor supported brand link with the given id is not found"
    }
};

export const vendor_supported_category_error_message = {
    already_linked: {
        code: 400,
        type: "already_linked",
        message: "This category is already linked to the vendor"
    },
    not_found: {
        code: 404,
        type: "not_found",
        message: "The vendor supported category link with the given id is not found"
    }
};

export const vendor_tax_identifier_error_message = {
    already_exists: {
        code: 400,
        type: "already_exists",
        message: "A tax identifier with this type already exists for this vendor in this country"
    },
    not_found: {
        code: 404,
        type: "not_found",
        message: "The vendor tax identifier with the given id is not found"
    }
};

export const vendor_address_error_message = {
    not_found: {
        code: 404,
        type: "not_found",
        message: "The vendor address with the given id is not found"
    }
};