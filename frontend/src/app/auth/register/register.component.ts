import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { NotificationService } from '../../shared/services/notification.service';

function passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const v = control.value || '';
    const ok = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@#_]).{8,}$/.test(v);
    return ok ? null : { passwordStrength: true };
}

function confirmPasswordValidator(group: AbstractControl): ValidationErrors | null {
    const pw = group.get('password')?.value;
    const cpw = group.get('confirmPassword')?.value;
    return pw && cpw && pw !== cpw ? { passwordMismatch: true } : null;
}

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
    form: FormGroup;
    loading = false;
    showPass = false;
    showConfirm = false;
    showPwTooltip = false;
    showCpTooltip = false;
    errorMsg = '';

    pwRules = [
        { label: 'Minimum 8 characters', regex: /.{8,}/ },
        { label: 'At least one uppercase (A-Z)', regex: /[A-Z]/ },
        { label: 'At least one lowercase (a-z)', regex: /[a-z]/ },
        { label: 'At least one number (0-9)', regex: /[0-9]/ },
        { label: 'At least one special (@, #, _)', regex: /[@#_]/ }
    ];

    constructor(private fb: FormBuilder, private auth: AuthService, private router: Router, private notify: NotificationService) {
        this.form = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            username: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            // personal_email is optional in the UI (no input field present), allow empty but validate format when provided
            personal_email: ['', [Validators.email]],
            role: ['', Validators.required],
            password: ['', [Validators.required, passwordStrengthValidator]],
            confirmPassword: ['', Validators.required]
        }, { validators: confirmPasswordValidator });
    }

    get f() { return this.form.controls; }
    get pwVal() { return this.f['password'].value || ''; }

    rulePass(regex: RegExp): boolean { return regex.test(this.pwVal); }

    submit() {
        this.errorMsg = '';
        if (this.form.invalid) { 
            this.form.markAllAsTouched(); 
            return; 
        }
        
        this.loading = true;
        const payload = {
            name: this.form.value.name.trim(),
            username: this.form.value.username.trim(),
            email: this.form.value.email.trim().toLowerCase(),
            personal_email: this.form.value.personal_email.trim().toLowerCase(),
            role: this.form.value.role,
            password: this.form.value.password
        };

        console.log('[RegisterComponent] Submitting registration form');
        console.log('[RegisterComponent] API Base URL:', (this.auth as any).API);
        
        this.auth.register(payload).subscribe({
            next: (res) => {
                console.log('[RegisterComponent] Registration success response:', res);
                this.notify.success('Account created! Please log in.');
                this.router.navigate(['/auth/login']);
            },
            error: (err) => {
                this.loading = false;
                
                // Comprehensive error logging and handling
                console.error('[RegisterComponent] Registration error:', err);
                console.error('[RegisterComponent] Error status:', err?.status);
                console.error('[RegisterComponent] Error statusText:', err?.statusText);
                console.error('[RegisterComponent] Error message:', err?.message);
                console.error('[RegisterComponent] Error error object:', err?.error);
                
                // Handle different error types
                let msg = 'Registration failed. Please try again.';
                
                // Status 0 errors - network/CORS issues
                if (err?.status === 0) {
                    console.error('[RegisterComponent] ⚠️  Status 0 Network Error detected');
                    console.error('[RegisterComponent] Possible causes:');
                    console.error('[RegisterComponent]   - CORS blocked by server');
                    console.error('[RegisterComponent]   - Network timeout');
                    console.error('[RegisterComponent]   - SSL/TLS certificate issue');
                    console.error('[RegisterComponent]   - Request blocked by firewall/proxy');
                    console.error('[RegisterComponent] Full error details:', JSON.stringify(err, null, 2));
                    msg = 'Network error: Unable to reach the server. Please check your connection and try again.';
                } 
                // Validation errors from backend
                else if (err?.status === 400) {
                    msg = err?.error?.message || err?.error?.errors?.[0]?.message || 'Validation error. Please check your input.';
                    console.error('[RegisterComponent] Validation error:', msg);
                }
                // Conflict errors (email/username exists)
                else if (err?.status === 409) {
                    msg = err?.error?.message || 'Email or username already in use.';
                    console.error('[RegisterComponent] Conflict error:', msg);
                }
                // Server errors
                else if (err?.status >= 500) {
                    msg = 'Server error. Please try again later.';
                    console.error('[RegisterComponent] Server error:', err?.status, err?.statusText);
                }
                // Other HTTP errors
                else if (err?.status) {
                    msg = err?.error?.message || err?.message || `Error (${err?.status}): ${err?.statusText}`;
                    console.error('[RegisterComponent] HTTP error:', msg);
                }
                // No status (likely network error)
                else {
                    console.error('[RegisterComponent] No status code - likely network issue');
                    console.error('[RegisterComponent] Error object:', err);
                    msg = 'Connection failed. Please check your internet connection.';
                }
                
                this.errorMsg = msg;
                this.notify.error(msg);
            }
        });
    }
}