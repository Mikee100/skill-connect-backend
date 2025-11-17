const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const { User, Worker, Client } = require('../models');

const register = async (req, res) => {
  try {
    const { role, name, email, phone, county, town, area, password, skills, expertise, bio, hourlyRate } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      role,
      name,
      email,
      phone,
      county,
      town,
      area,
      password: hashedPassword
    });

    // Create role-specific profile
    if (role === 'worker') {
      await Worker.create({
        userId: user.id,
        skills: skills || [],
        expertise: expertise || 'beginner',
        bio,
        hourlyRate
      });
    } else if (role === 'client') {
      await Client.create({
        userId: user.id
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      include: req.user.role === 'worker' ? [{ model: Worker, as: 'workerProfile' }] : [{ model: Client, as: 'clientProfile' }]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

const updateProfile = async (req, res) => {
  try {
    const { name, phone, county, town, area, bio, hourlyRate, skills, expertise } = req.body;

    // Handle profile image upload
    let profileImage = null;
    if (req.file) {
      profileImage = `/uploads/${req.file.filename}`;
    }

    // Update user
    const updateData = { name, phone, county, town, area };
    if (profileImage) {
      updateData.profileImage = profileImage;
    }

    await User.update(updateData, { where: { id: req.user.userId } });

    // Update role-specific profile
    if (req.user.role === 'worker') {
      await Worker.update(
        { bio, hourlyRate, skills, expertise },
        { where: { userId: req.user.userId } }
      );
    }

    // Fetch updated user data to return
    const updatedUser = await User.findByPk(req.user.userId);

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        county: updatedUser.county,
        town: updatedUser.town,
        area: updatedUser.area,
        profileImage: updatedUser.profileImage
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  upload
};
