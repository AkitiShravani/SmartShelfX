const { body, validationResult } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: errors.array().map(err => ({
                field: err.param,
                message: err.msg,
                value: err.value
            }))
        });
    }
    next();
};

// Register validation rules
const validateRegister = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    
    body('email')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail()
        .toLowerCase(),
    
    body('password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@#_])/)
        .withMessage('Password must contain: uppercase, lowercase, number, and @/#/_'),
    
    body('personal_email')
        .optional()
        .isEmail().withMessage('Invalid personal email format')
        .normalizeEmail()
        .toLowerCase(),
    
    body('role')
        .optional()
        .isIn(['MANAGER', 'VENDOR']).withMessage('Invalid role'),
    
    body('username')
        .optional()
        .trim()
        .isLength({ min: 3, max: 100 }).withMessage('Username must be 3-100 characters')
        .matches(/^[a-zA-Z0-9_-]+$/).withMessage('Username can only contain alphanumeric characters, underscores, and hyphens'),
    
    handleValidationErrors
];

// Login validation rules
const validateLogin = [
    body('email')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail()
        .toLowerCase(),
    
    body('password')
        .notEmpty().withMessage('Password is required'),
    
    handleValidationErrors
];

// Forgot password validation
const validateForgotPassword = [
    body('email')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail()
        .toLowerCase(),
    
    body('personal_email')
        .optional()
        .isEmail().withMessage('Invalid personal email format')
        .normalizeEmail()
        .toLowerCase(),
    
    handleValidationErrors
];

// Reset password validation
const validateResetPassword = [
    body('token')
        .notEmpty().withMessage('Reset token is required')
        .isLength({ min: 32, max: 128 }).withMessage('Invalid token format'),
    
    body('password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@#_])/)
        .withMessage('Password must contain: uppercase, lowercase, number, and @/#/_'),
    
    body('email')
        .optional()
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail()
        .toLowerCase(),
    
    handleValidationErrors
];

// Product validation
const validateProduct = [
    body('name')
        .trim()
        .notEmpty().withMessage('Product name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    
    body('sku')
        .trim()
        .notEmpty().withMessage('SKU is required')
        .isLength({ min: 2, max: 50 }).withMessage('SKU must be 2-50 characters')
        .matches(/^[A-Z0-9\-_]+$/i).withMessage('SKU can only contain alphanumeric characters, hyphens, and underscores'),
    
    body('category')
        .trim()
        .notEmpty().withMessage('Category is required')
        .isLength({ min: 2, max: 100 }).withMessage('Category must be 2-100 characters'),
    
    body('reorder_level')
        .isInt({ min: 1 }).withMessage('Reorder level must be a positive integer'),
    
    body('current_stock')
        .optional()
        .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
    
    body('unit_price')
        .isFloat({ min: 0 }).withMessage('Unit price must be a non-negative number'),
    
    body('vendor_id')
        .optional()
        .isInt({ min: 1 }).withMessage('Invalid vendor ID'),
    
    body('expiry_date')
        .optional()
        .isISO8601().withMessage('Invalid date format'),
    
    handleValidationErrors
];

// Transaction validation
const validateTransaction = [
    body('product_id')
        .isInt({ min: 1 }).withMessage('Invalid product ID'),
    
    body('quantity')
        .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    
    body('type')
        .isIn(['IN', 'OUT']).withMessage('Type must be IN or OUT'),
    
    body('notes')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Notes must be less than 500 characters'),
    
    handleValidationErrors
];

// Purchase order validation
const validatePurchaseOrder = [
    body('product_id')
        .isInt({ min: 1 }).withMessage('Invalid product ID'),
    
    body('vendor_id')
        .optional()
        .isInt({ min: 1 }).withMessage('Invalid vendor ID'),
    
    body('quantity')
        .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    
    body('status')
        .optional()
        .isIn(['PENDING', 'APPROVED', 'DISPATCHED', 'DELIVERED', 'CANCELLED'])
        .withMessage('Invalid status'),
    
    body('notes')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Notes must be less than 500 characters'),
    
    handleValidationErrors
];

module.exports = {
    validateRegister,
    validateLogin,
    validateForgotPassword,
    validateResetPassword,
    validateProduct,
    validateTransaction,
    validatePurchaseOrder,
    handleValidationErrors
};
