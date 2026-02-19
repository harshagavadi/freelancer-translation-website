# 🚀 Deploy Lingua Solutions India to Vercel

## Method 1: Deploy via Vercel Dashboard (Easiest)

### Step 1: Prepare Your Project
1. Make sure all your code is committed to a Git repository (GitHub, GitLab, or Bitbucket)
2. Push your code to the remote repository

### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"** or **"Log In"** (use GitHub for easiest integration)
3. Click **"Add New Project"**
4. Import your repository:
   - Select your Git provider (GitHub/GitLab/Bitbucket)
   - Find and select your repository
5. Configure your project:
   - **Project Name:** linguasolutionsindia (or your preferred name)
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
6. Click **"Deploy"**

### Step 3: Wait for Deployment
- Vercel will automatically build and deploy your site
- This takes 1-3 minutes
- You'll get a live URL like: `linguasolutionsindia.vercel.app`

---

## Method 2: Deploy via Vercel CLI

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy
```bash
# From your project directory
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (Select your account)
# - Link to existing project? No
# - What's your project's name? linguasolutionsindia
# - In which directory is your code located? ./
# - Want to override the settings? No
```

### Step 4: Deploy to Production
```bash
vercel --prod
```

---

## 🎯 Post-Deployment

### Your Live URLs:
- **Preview:** `https://linguasolutionsindia-xxx.vercel.app`
- **Production:** `https://linguasolutionsindia.vercel.app`

### Add Custom Domain (Optional):
1. Go to your project in Vercel Dashboard
2. Click **"Settings"** → **"Domains"**
3. Add your domain (e.g., `linguasolutionsindia.com`)
4. Follow DNS configuration instructions

---

## 📋 Deployment Checklist

✅ **Before Deploying:**
- [x] All features working locally
- [x] Build successful (`npm run build`)
- [x] No console errors
- [x] Razorpay keys configured
- [x] vercel.json created
- [x] Code pushed to Git repository

✅ **After Deploying:**
- [ ] Test all features on live site
- [ ] Check wallet functionality
- [ ] Verify Razorpay integration
- [ ] Test login/registration
- [ ] Check responsive design on mobile
- [ ] Verify currency detection works
- [ ] Test file uploads
- [ ] Check messaging system

---

## 🔧 Environment Variables (If Needed)

If you need to add environment variables:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add any sensitive keys (though currently all are in code)

**Note:** Razorpay keys are currently hardcoded. For production, consider moving to environment variables:
```
VITE_RAZORPAY_KEY_ID=rzp_live_RtvHUTxmXEeF4M
VITE_RAZORPAY_KEY_SECRET=45TO74k2Ov4jJXWp9K0Oal1r
```

---

## 🔄 Automatic Deployments

Once connected to Git:
- **Every push to main branch** → Automatic production deployment
- **Every push to other branches** → Automatic preview deployment
- **Pull requests** → Automatic preview deployments

---

## 🛠️ Troubleshooting

### Build Fails?
```bash
# Test build locally first
npm run build

# Check for errors
npm run preview
```

### 404 Errors on Routes?
- The `vercel.json` file handles this with rewrites

### Environment Issues?
- Make sure Node.js version is compatible (18.x or higher)

---

## 📱 Features That Work on Vercel:

✅ Automatic currency detection  
✅ Location-based services  
✅ Razorpay integration  
✅ File uploads (stored in localStorage)  
✅ Real-time messaging  
✅ Wallet system  
✅ Multi-currency support  
✅ UPI payments  
✅ Project management  

---

## 🌐 Your Live Website

After deployment, your website will be live at:
**https://linguasolutionsindia.vercel.app**

Share this URL with your clients and freelancers!

---

## 📞 Need Help?

- Vercel Documentation: https://vercel.com/docs
- Vercel Support: https://vercel.com/support
- Check deployment logs in Vercel Dashboard

---

**Happy Deploying! 🚀**
