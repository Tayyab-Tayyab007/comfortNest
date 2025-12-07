document.addEventListener('DOMContentLoaded', function() {
  // Regular login form handler is now managed by login-auth0.js
  // This file now only handles the forgot password functionality
  
  // Check if already logged in
  if (localStorage.getItem('token')) {
    window.location.href = 'dashboard.html';
    return;
  }
  
  // Forgot password functionality
  const forgotPasswordLink = document.getElementById('forgot-password-link');
  const forgotPasswordModal = document.getElementById('forgot-password-modal');
  const closeModal = document.querySelector('.close-modal');
  const sendOtpBtn = document.getElementById('send-otp-btn');
  const resetPasswordBtn = document.getElementById('reset-password-btn');
  const otpSection = document.getElementById('otp-section');
  
  // Password requirement elements
  const reqLength = document.getElementById('req-length');
  const reqNumber = document.getElementById('req-number');
  const reqSpecial = document.getElementById('req-special');
  const newPasswordInput = document.getElementById('new-password');
  
  // Store OTP for verification
  let generatedOTP = '';
  let otpEmail = '';
  
  // Password validation function
  function validatePassword(password) {
    const minLength = password.length >= 8;
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    // Update UI indicators
    updateRequirement(reqLength, minLength);
    updateRequirement(reqNumber, hasNumber);
    updateRequirement(reqSpecial, hasSpecial);
    
    return minLength && hasNumber && hasSpecial;
  }
  
  // Update requirement indicator
  function updateRequirement(element, isValid) {
    if (isValid) {
      element.classList.add('requirement-met');
      element.classList.remove('requirement-not-met');
      element.querySelector('i').className = 'fas fa-check-circle';
    } else {
      element.classList.add('requirement-not-met');
      element.classList.remove('requirement-met');
      element.querySelector('i').className = 'fas fa-times-circle';
    }
  }
  
  // Add event listener for password validation
  if (newPasswordInput) {
    newPasswordInput.addEventListener('input', function() {
      validatePassword(this.value);
    });
  }
  
  // Open modal when clicking forgot password link
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', function(e) {
      e.preventDefault();
      forgotPasswordModal.style.display = 'block';
    });
  }
  
  // Close modal when clicking X
  if (closeModal) {
    closeModal.addEventListener('click', function() {
      forgotPasswordModal.style.display = 'none';
      // Reset form
      document.getElementById('forgot-password-form').reset();
      otpSection.style.display = 'none';
      
      // Reset password requirement indicators
      updateRequirement(reqLength, false);
      updateRequirement(reqNumber, false);
      updateRequirement(reqSpecial, false);
    });
  }
  
  // Close modal when clicking outside
  window.addEventListener('click', function(event) {
    if (event.target === forgotPasswordModal) {
      forgotPasswordModal.style.display = 'none';
      // Reset form
      document.getElementById('forgot-password-form').reset();
      otpSection.style.display = 'none';
      
      // Reset password requirement indicators
      updateRequirement(reqLength, false);
      updateRequirement(reqNumber, false);
      updateRequirement(reqSpecial, false);
    }
  });
  
  // Send OTP button handler
  if (sendOtpBtn) {
    sendOtpBtn.addEventListener('click', async function() {
      const email = document.getElementById('reset-email').value;
      
      if (!email) {
        alert('Please enter your email address');
        return;
      }
      
      try {
        // Generate a random 6-digit OTP
        generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
        otpEmail = email;
        
        // Show loading state
        sendOtpBtn.disabled = true;
        sendOtpBtn.textContent = 'Sending...';
        
        // Calculate expiry time (current time + 15 minutes)
        const expiry = new Date(Date.now() + 15 * 60000);
        const time = expiry.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Prepare template parameters
        const templateParams = {
          to_name: email.split('@')[0],
          passcode: generatedOTP,
          time: time,
          email: email,
          to_email: email,
          from_name: "ComfortNest",
          from_email: "comfortnestproject@gmail.com",
          message: `Your OTP for password reset is: ${generatedOTP}. Valid until ${time}.`,
          reply_to: "comfortnestproject@gmail.com",
          recipient: email
        };
        
        console.log("Sending OTP to:", email);
        console.log("Template parameters:", JSON.stringify(templateParams));
        console.log("Using service ID:", "service_2t61uew");
        console.log("Using template ID:", "template_lfg9duc");
        
        // Send email using EmailJS
        const response = await emailjs.send(
          "service_2t61uew", // Service ID
          "template_lfg9duc", // Template ID
          templateParams
        ).catch(error => {
          console.error("EmailJS error details:", error);
          if (error.text) {
            console.error("Error text:", error.text);
          }
          throw new Error(`Failed to send OTP: ${error.text || error.message || 'Unknown error'}`);
        });
        
        console.log("EmailJS response:", response);
        alert('OTP has been sent to your email');
        
        // Show OTP verification section
        otpSection.style.display = 'block';
        
        // Reset button state
        sendOtpBtn.disabled = false;
        sendOtpBtn.textContent = 'Resend OTP';
        
      } catch (error) {
        console.error('Error sending OTP:', error);
        alert(`Failed to send OTP: ${error.message || 'Please try again'}`);
        sendOtpBtn.disabled = false;
        sendOtpBtn.textContent = 'Send OTP';
      }
    });
  }
  
  // Reset password button handler
  if (resetPasswordBtn) {
    resetPasswordBtn.addEventListener('click', async function() {
      const enteredOTP = document.getElementById('otp').value;
      const newPassword = document.getElementById('new-password').value;
      const confirmPassword = document.getElementById('confirm-new-password').value;
      
      // Validate inputs
      if (!enteredOTP) {
        alert('Please enter the OTP sent to your email');
        return;
      }
      
      if (!newPassword) {
        alert('Please enter a new password');
        return;
      }
      
      if (newPassword !== confirmPassword) {
        alert('Passwords do not match');
        return;
      }
      
      // Validate password strength
      if (!validatePassword(newPassword)) {
        alert('Please ensure your password meets all requirements');
        return;
      }
      
      // Verify OTP
      if (enteredOTP !== generatedOTP) {
        alert('Invalid OTP. Please check and try again');
        return;
      }
      
      try {
        // Show loading state
        resetPasswordBtn.disabled = true;
        resetPasswordBtn.textContent = 'Resetting...';
        
        // Make API call to reset password
        const response = await window.userAPI.resetPassword({
          email: otpEmail, // Use the email from when OTP was sent
          otp: enteredOTP,
          newPassword: newPassword
        });

        if (response.success) {
          alert('Password reset successful! Please log in with your new password.');
          window.location.href = 'login.html';
        } else {
          throw new Error(response.message || 'Failed to reset password');
        }
        
      } catch (error) {
        console.error('Password reset error:', error);
        alert(`Password reset failed: ${error.message || 'Please try again'}`);
        resetPasswordBtn.disabled = false;
        resetPasswordBtn.textContent = 'Reset Password';
      }
    });
  }
  
  // Phone OTP login section (managed by login-auth0.js now)
  
  // Add login form handling
  const loginForm = document.getElementById('login-form');
  const statusMessage = document.getElementById('status-message');
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      try {
        const response = await window.userAPI.login({ email, password });
        if (response && response.token) {
          statusMessage.textContent = 'Login successful! Redirecting...';
          statusMessage.className = 'status-message status-success';
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 1000);
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (error) {
        statusMessage.textContent = error.message || 'Login failed. Please try again.';
        statusMessage.className = 'status-message status-error';
      }
    });
  }
});