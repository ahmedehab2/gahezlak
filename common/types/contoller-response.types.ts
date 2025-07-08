export type PaginatedRespone<T> = {
    data: T[];
    total: number;
    page: number;
    totalPages: number;
}

export type SuccessResponse<T> = {
    message: 'Data retreived.' | string;
    data: T;
};

export type ErrorResponse = {
    code: number,
    message: string;
    data: any;
};

export type ValidationErrorResponse = { message: string; field?: string }[];


