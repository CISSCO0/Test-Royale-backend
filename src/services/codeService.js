const Code = require('../models/code');

class CodeService {
  constructor() {
    this.defaultChallenges = [
      {
        title: 'Simple Calculator',
        description: 'Create a calculator that can perform basic arithmetic operations (+, -, *, /)',
        language: 'python',
        baseCode: `def calculator(a, operation, b):
    # Implement basic calculator operations
    # Return the result of a operation b
    # Handle division by zero
    pass`
      },
      {
        title: 'Palindrome Checker',
        description: 'Check if a given string is a palindrome (reads the same forwards and backwards)',
        language: 'python',
        baseCode: `def is_palindrome(text):
    # Check if the text is a palindrome
    # Ignore case and non-alphanumeric characters
    # Return True if palindrome, False otherwise
    pass`
      },
      {
        title: 'Array Sum',
        description: 'Find the sum of all elements in an array',
        language: 'java',
        baseCode: `public class ArraySum {
    public static int sumArray(int[] numbers) {
        // Calculate and return the sum of all elements
        // Handle empty array case
        return 0;
    }
}`
      },
      {
        title: 'String Reverser',
        description: 'Reverse a given string without using built-in reverse methods',
        language: 'csharp',
        baseCode: `public class StringReverser {
    public static string ReverseString(string input) {
        // Reverse the input string
        // Return the reversed string
        return "";
    }
}`
      }
    ];
  }

  /**
   * Get all code challenges
   * @param {Object} filters - Filter options
   * @returns {Object} List of code challenges
   */
  async getAllChallenges(filters = {}) {
    try {
      const query = {};
      
      if (filters.language) {
        query.language = filters.language;
      }

      if (filters.search) {
        query.$or = [
          { title: { $regex: filters.search, $options: 'i' } },
          { description: { $regex: filters.search, $options: 'i' } }
        ];
      }

      const challenges = await Code.find(query)
        .sort({ createdAt: -1 })
        .limit(filters.limit || 50);

      return {
        success: true,
        challenges: challenges.map(challenge => ({
          id: challenge._id,
          title: challenge.title,
          description: challenge.description,
          language: challenge.language,
          createdAt: challenge.createdAt
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get a specific code challenge
   * @param {string} challengeId - Challenge ID
   * @returns {Object} Code challenge details
   */
  async getChallenge(challengeId) {
    try {
      const challenge = await Code.findById(challengeId);
      
      if (!challenge) {
        return {
          success: false,
          error: 'Challenge not found'
        };
      }

      return {
        success: true,
        challenge: {
          id: challenge._id,
          title: challenge.title,
          description: challenge.description,
          language: challenge.language,
          baseCode: challenge.baseCode,
          createdAt: challenge.createdAt
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a new code challenge
   * @param {Object} challengeData - Challenge data
   * @returns {Object} Created challenge
   */
  async createChallenge(challengeData) {
    try {
      const { title, description, language, baseCode } = challengeData;

      // Validate required fields
      if (!title || !language || !baseCode) {
        return {
          success: false,
          error: 'Title, language, and base code are required'
        };
      }

      // Validate language
      const validLanguages = ['python', 'java', 'csharp'];
      if (!validLanguages.includes(language)) {
        return {
          success: false,
          error: 'Invalid language. Supported languages: python, java, csharp'
        };
      }

      const challenge = new Code({
        title,
        description: description || '',
        language,
        baseCode
      });

      await challenge.save();

      return {
        success: true,
        challenge: {
          id: challenge._id,
          title: challenge.title,
          description: challenge.description,
          language: challenge.language,
          baseCode: challenge.baseCode,
          createdAt: challenge.createdAt
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update a code challenge
   * @param {string} challengeId - Challenge ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated challenge
   */
  async updateChallenge(challengeId, updateData) {
    try {
      const allowedUpdates = ['title', 'description', 'baseCode'];
      const updates = {};

      // Only allow certain fields to be updated
      Object.keys(updateData).forEach(key => {
        if (allowedUpdates.includes(key)) {
          updates[key] = updateData[key];
        }
      });

      if (Object.keys(updates).length === 0) {
        return {
          success: false,
          error: 'No valid fields to update'
        };
      }

      const challenge = await Code.findByIdAndUpdate(
        challengeId,
        updates,
        { new: true, runValidators: true }
      );

      if (!challenge) {
        return {
          success: false,
          error: 'Challenge not found'
        };
      }

      return {
        success: true,
        challenge: {
          id: challenge._id,
          title: challenge.title,
          description: challenge.description,
          language: challenge.language,
          baseCode: challenge.baseCode,
          createdAt: challenge.createdAt
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete a code challenge
   * @param {string} challengeId - Challenge ID
   * @returns {Object} Deletion result
   */
  async deleteChallenge(challengeId) {
    try {
      const challenge = await Code.findByIdAndDelete(challengeId);
      
      if (!challenge) {
        return {
          success: false,
          error: 'Challenge not found'
        };
      }

      return {
        success: true,
        message: 'Challenge deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get a random challenge
   * @param {string} language - Optional language filter
   * @returns {Object} Random challenge
   */
  async getRandomChallenge(language = null) {
    try {
      const query = language ? { language } : {};
      
      const count = await Code.countDocuments(query);
      if (count === 0) {
        return {
          success: false,
          error: 'No challenges found'
        };
      }

      const randomIndex = Math.floor(Math.random() * count);
      const challenge = await Code.findOne(query).skip(randomIndex);

      return {
        success: true,
        challenge: {
          id: challenge._id,
          title: challenge.title,
          description: challenge.description,
          language: challenge.language,
          baseCode: challenge.baseCode,
          createdAt: challenge.createdAt
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get challenges by language
   * @param {string} language - Programming language
   * @returns {Object} Challenges for the language
   */
  async getChallengesByLanguage(language) {
    try {
      const challenges = await Code.find({ language })
        .sort({ createdAt: -1 });

      return {
        success: true,
        challenges: challenges.map(challenge => ({
          id: challenge._id,
          title: challenge.title,
          description: challenge.description,
          language: challenge.language,
          createdAt: challenge.createdAt
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Initialize default challenges
   * @returns {Object} Initialization result
   */
  async initializeDefaultChallenges() {
    try {
      const existingCount = await Code.countDocuments();
      
      if (existingCount > 0) {
        return {
          success: true,
          message: 'Challenges already exist',
          count: existingCount
        };
      }

      const createdChallenges = [];
      
      for (const challengeData of this.defaultChallenges) {
        const challenge = new Code(challengeData);
        await challenge.save();
        createdChallenges.push(challenge._id);
      }

      return {
        success: true,
        message: 'Default challenges created successfully',
        count: createdChallenges.length,
        challengeIds: createdChallenges
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get challenge statistics
   * @returns {Object} Challenge statistics
   */
  async getChallengeStats() {
    try {
      const totalChallenges = await Code.countDocuments();
      
      const languageStats = await Code.aggregate([
        {
          $group: {
            _id: '$language',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      const recentChallenges = await Code.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title language createdAt');

      return {
        success: true,
        stats: {
          totalChallenges,
          languageStats,
          recentChallenges
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Search challenges
   * @param {string} searchTerm - Search term
   * @returns {Object} Search results
   */
  async searchChallenges(searchTerm) {
    try {
      if (!searchTerm || searchTerm.trim().length === 0) {
        return {
          success: false,
          error: 'Search term is required'
        };
      }

      const challenges = await Code.find({
        $or: [
          { title: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } }
        ]
      }).sort({ createdAt: -1 });

      return {
        success: true,
        challenges: challenges.map(challenge => ({
          id: challenge._id,
          title: challenge.title,
          description: challenge.description,
          language: challenge.language,
          createdAt: challenge.createdAt
        })),
        count: challenges.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = CodeService;