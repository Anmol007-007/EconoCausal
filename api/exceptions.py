from __future__ import annotations
from typing import Any, Dict, Optional

class EconoCausalException(Exception):
    def __init__(
        self,
        message: str,
        error_code: str = "INTERNAL_ERROR",
        status_code: int = 500,
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.details = details or {}

class ModelNotFittedError(EconoCausalException):
    def __init__(self, message: str = "Double Machine Learning model is not fitted yet.", details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, error_code="MODEL_NOT_FITTED", status_code=400, details=details)

class InvalidDatasetError(EconoCausalException):
    def __init__(self, message: str = "Uploaded dataset fails causal schema or variance checks.", details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, error_code="INVALID_DATASET", status_code=422, details=details)

class InfeasibleAllocationError(EconoCausalException):
    def __init__(self, message: str = "MILP budget allocation problem has no feasible solution.", details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, error_code="INFEASIBLE_ALLOCATION", status_code=422, details=details)

class AuthenticationError(EconoCausalException):
    def __init__(self, message: str = "Invalid or expired authentication credentials.", details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, error_code="AUTHENTICATION_FAILED", status_code=401, details=details)

class PermissionDeniedError(EconoCausalException):
    def __init__(self, message: str = "You do not have permission to perform this action.", details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, error_code="PERMISSION_DENIED", status_code=403, details=details)

class ResourceNotFoundError(EconoCausalException):
    def __init__(self, message: str = "The requested resource was not found.", details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, error_code="RESOURCE_NOT_FOUND", status_code=404, details=details)

class RateLimitExceededError(EconoCausalException):
    def __init__(self, message: str = "API rate limit exceeded. Please wait before retrying.", details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, error_code="RATE_LIMIT_EXCEEDED", status_code=429, details=details)

class DatabaseError(EconoCausalException):
    def __init__(self, message: str = "A database operation failed.", details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, error_code="DATABASE_ERROR", status_code=500, details=details)

