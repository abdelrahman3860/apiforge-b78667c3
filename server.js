const express = require('express');
const cors = require('cors');
const { faker } = require('@faker-js/faker');

const app = express();
app.use(cors());
app.use(express.json());

// API key authentication middleware
app.use((req, res, next) => {
  if (req.path === '/health') return next();
  const key = req.headers['x-api-key'];
  if (process.env.API_KEY && (!key || key !== process.env.API_KEY)) {
    return res.status(401).json({ success: false, error: 'Invalid or missing API key' });
  }
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'API is running' });
});

// Job data endpoint
app.get('/job/:title', (req, res) => {
  try {
    const { title } = req.params;
    
    if (!title || title.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid job title',
        message: 'Job title cannot be empty'
      });
    }

    // Normalize job title for consistent data
    const normalizedTitle = title.toLowerCase().trim();
    
    // Generate consistent data based on job title hash
    const seed = normalizedTitle.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    faker.seed(Math.abs(seed));
    
    // Determine job category and generate appropriate data
    const categories = ['engineering', 'marketing', 'sales', 'design', 'management', 'support'];
    const category = categories[Math.abs(seed) % categories.length];
    
    // Generate salary based on category
    const baseSalary = {
      engineering: { min: 80000, max: 180000 },
      marketing: { min: 50000, max: 120000 },
      sales: { min: 40000, max: 150000 },
      design: { min: 60000, max: 140000 },
      management: { min: 90000, max: 200000 },
      support: { min: 35000, max: 80000 }
    }[category];
    
    const salaryMin = baseSalary.min + (Math.abs(seed) % 20000);
    const salaryMax = baseSalary.max + (Math.abs(seed) % 30000);
    
    // Generate skills based on category
    const skillsByCategory = {
      engineering: ['JavaScript', 'Python', 'SQL', 'Git', 'AWS', 'Docker', 'React', 'Node.js'],
      marketing: ['SEO', 'Google Analytics', 'Content Marketing', 'Social Media', 'Email Marketing', 'PPC', 'Copywriting'],
      sales: ['CRM', 'Lead Generation', 'Negotiation', 'Relationship Building', 'Salesforce', 'Cold Calling', 'Presentation Skills'],
      design: ['Figma', 'Adobe Creative Suite', 'UI/UX', 'Prototyping', 'User Research', 'Typography', 'Color Theory'],
      management: ['Team Leadership', 'Project Management', 'Agile', 'Budgeting', 'Strategic Planning', 'Performance Management'],
      support: ['Customer Service', 'Ticketing Systems', 'Communication', 'Problem Solving', 'Product Knowledge', 'Patience']
    };
    
    const availableSkills = skillsByCategory[category];
    const numSkills = 3 + (Math.abs(seed) % 4); // 3-6 skills
    const skills = [];
    const usedIndexes = new Set();
    
    while (skills.length < numSkills) {
      const index = Math.abs(seed + skills.length) % availableSkills.length;
      if (!usedIndexes.has(index)) {
        skills.push(availableSkills[index]);
        usedIndexes.add(index);
      }
    }
    
    // Generate job description
    const descriptions = {
      engineering: `Responsible for developing and maintaining software applications. Collaborate with cross-functional teams to design, build, and deploy scalable solutions. Write clean, efficient code and participate in code reviews.`,
      marketing: `Develop and execute marketing strategies to drive brand awareness and customer acquisition. Analyze market trends and competitor activities. Create compelling content and manage digital marketing campaigns.`,
      sales: `Drive revenue growth by identifying and closing new business opportunities. Build and maintain strong client relationships. Meet and exceed sales targets through effective pipeline management and negotiation.`,
      design: `Create intuitive and visually appealing user interfaces. Conduct user research and translate insights into design solutions. Collaborate with developers to ensure design implementation meets specifications.`,
      management: `Lead and inspire teams to achieve organizational goals. Develop strategic initiatives and oversee their execution. Manage budgets, resources, and stakeholder relationships effectively.`,
      support: `Provide exceptional customer service and technical support. Troubleshoot issues and provide timely solutions. Maintain high customer satisfaction through effective communication and problem resolution.`
    };
    
    const result = {
      title: title.charAt(0).toUpperCase() + title.slice(1).toLowerCase(),
      salaryRange: {
        min: Math.round(salaryMin / 1000) * 1000,
        max: Math.round(salaryMax / 1000) * 1000,
        currency: 'USD'
      },
      requiredSkills: skills,
      description: descriptions[category],
      category: category.charAt(0).toUpperCase() + category.slice(1)
    };
    
    res.json({ success: true, data: result });
    
  } catch (error) {
    console.error('Error processing job request:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      message: 'Unable to process job information'
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Not found',
    message: 'The requested endpoint does not exist' 
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error',
    message: 'An unexpected error occurred' 
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Job Salary & Skills API running on port ${PORT}`);
});