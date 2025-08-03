document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signup-form');
  
  // Initialize modal elements
  const feedbackModal = document.getElementById('feedbackModal');
  const feedbackModalTitle = document.getElementById('feedbackModalTitle');
  const feedbackModalMessage = document.getElementById('feedbackModalMessage');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  
  // Setup modal close buttons
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      hideModal();
    });
  }
  
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', () => {
      hideModal();
    });
  }
  
  function updateStatusMessage(message, type) {
    alert(message);
  }
  
  // Handle sending Email OTP
  const sendEmailOtpBtn = document.getElementById('sendEmailOtp');
  const emailOtpInput = document.getElementById('emailOtp');
  const verifyEmailOtpBtn = document.getElementById('verifyEmailOtp');
  let emailOtp = '';
  
  if (sendEmailOtpBtn) {
    sendEmailOtpBtn.addEventListener('click', async () => {
      const email = document.getElementById('email').value;
      
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        updateStatusMessage('Please enter a valid email address', 'error');
        return;
      }
      
      try {
        sendEmailOtpBtn.disabled = true;
        sendEmailOtpBtn.textContent = 'Sending...';
        
        // Generate a random 6-digit OTP
        emailOtp = generateOtp();
        
        // Calculate expiry time (current time + 15 minutes)
        const expiry = new Date(Date.now() + 15 * 60000);
        const time = expiry.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Prepare email template parameters
        const templateParams = {
          to_name: email.split('@')[0],
          passcode: emailOtp,
          time: time,
          email: email,
          to_email: email,
          from_name: "ComfortNest",
          from_email: "comfortnestproject@gmail.com",
          message: `Your verification OTP is: ${emailOtp}. Valid until ${time}.`,
          reply_to: "comfortnestproject@gmail.com",
          recipient: email
        };
        
        // Send email using EmailJS
        await emailjs.send(
          "service_2t61uew", // Service ID
          "template_lfg9duc", // Template ID
          templateParams
        );
        
        alert('Email OTP sent successfully!');
        emailOtpInput.style.display = 'block';
        verifyEmailOtpBtn.style.display = 'block';
        
        sendEmailOtpBtn.textContent = 'Resend OTP';
        sendEmailOtpBtn.disabled = false;
      } catch (error) {
        console.error('Error sending email OTP:', error);
        updateStatusMessage('Failed to send email OTP: ' + error.message, 'error');
        sendEmailOtpBtn.textContent = 'Send OTP to Email';
        sendEmailOtpBtn.disabled = false;
      }
    });
  }
  
  // Handle verifying Email OTP
  if (verifyEmailOtpBtn) {
    verifyEmailOtpBtn.addEventListener('click', () => {
      const enteredOtp = emailOtpInput.value;
      
      if (!enteredOtp) {
        updateStatusMessage('Please enter the OTP sent to your email', 'error');
        return;
      }
      
      if (enteredOtp === emailOtp) {
        alert('Email verified successfully!');
        
        // Visual feedback
        emailOtpInput.style.borderColor = '#4CAF50';
        emailOtpInput.style.backgroundColor = '#e8f5e9';
        
        // Disable the OTP field and verify button
        emailOtpInput.disabled = true;
        verifyEmailOtpBtn.disabled = true;
        verifyEmailOtpBtn.textContent = 'Verified ✓';
        verifyEmailOtpBtn.style.backgroundColor = '#4CAF50';
      } else {
        alert('Invalid OTP. Please try again.');
      }
    });
  }
  
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Show processing message
      updateStatusMessage('Processing your registration...', 'info');
      
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      
      // Basic validation
      if (!name || !email || !password || !confirmPassword) {
        alert('Please fill in all required fields');
        return;
      }
      
      // Validate email format
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert('Please enter a valid email address');
        return;
      }
      
      // Validate passwords match
      if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
      }
      
      // Validate password strength
      //   alert(`Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.`);
      //   return;
      

      
      try {
        // Disable the submit button to prevent multiple submissions
        const submitButton = signupForm.querySelector('button[type="submit"]');
        if (submitButton) {
          submitButton.disabled = true;
          submitButton.textContent = 'Signing up...';
        }
        
        // Check if email OTP has been verified
        const emailOtpInput = document.getElementById('emailOtp');
        if (emailOtpInput && (!emailOtpInput.value || emailOtpInput.value !== emailOtp)) {
          alert('Please verify your email with OTP before registering');
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Sign Up';
          }
          return;
        }
        
        // Register the user in the backend
        try {
          // Check if API is available
          if (window.userAPI && typeof window.userAPI.register === 'function') {
            try {
              const response = await window.userAPI.register({
                name: name,
                email: email,
                password: password,
              });
              
              updateStatusMessage('Registration successful! Your account has been created. Redirecting to login...', 'success');
              
              // Store user data in localStorage for login
              if (response && response.data) {
                // Ensure all required fields are present
                const userData = {
                  ...response.data,
                  id: response.data._id || response.data.id,
                  role: response.data.role || 'user',
                  createdAt: response.data.createdAt || new Date().toISOString()
                };
                
                localStorage.setItem('user', JSON.stringify(userData));
                if (response.token) {
                  localStorage.setItem('token', response.token);
                }
              } else if (response && response.message) {
                // Handle cases where response.data might be empty but there's a message
                updateStatusMessage(response.message, 'success');
              }
              
              setTimeout(() => {
                window.location.href = '/login.html';
              }, 2000);
            } catch (apiError) {
              console.error('API Registration Error:', apiError);
              updateStatusMessage('Registration failed. Please try again. (' + (apiError.message || 'Unknown API error') + ')', 'error');
            }
          } else {
            // Fallback for when window.userAPI is not defined
            alert('API not available. Please check your internet connection or try again later.');
            updateStatusMessage('API not available', 'error');
          }
        } catch (error) {
          console.error('General Registration Error:', error);
          updateStatusMessage('An unexpected error occurred during registration: ' + error.message, 'error');
        } finally {
          // Re-enable the submit button
          const submitButton = signupForm.querySelector('button[type="submit"]');
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Sign Up';
          }
        }
      } catch (validationError) {
        console.error('Validation Error:', validationError);
        alert(validationError.message);
        const submitButton = signupForm.querySelector('button[type="submit"]');
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = 'Sign Up';
        }
      }
    });
  }
  


  function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }


});


