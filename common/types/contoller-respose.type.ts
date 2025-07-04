interface IResponse<T> {
    status: number;
    message?: string;
    data: T | T[];
}

interface IErrorResponse {
    status: number;
    message: string;
}

interface IPaginatedRespone<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export type {
    IResponse,
    IErrorResponse,
    IPaginatedRespone
}