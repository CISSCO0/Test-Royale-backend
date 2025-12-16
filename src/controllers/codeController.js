const CodeService = require('../services/codeService');
const path = require('path'); // Add this import
const codeService = new CodeService();

class CodeController {
   constructor() {}
   
/**
 * Post /api/code/compileAndRunCSharpCode 
 * @param {object} req 
 * @param {object} res
 * @param {object} req.body
 * @param {string} req.body.code 
 * @param {string} req.body.tests
 * @param {string} req.body.playerId 
 * @returns {object}
 */
compileAndRunCSharpCode = async (req, res) => {
  try {
    const { code, tests, playerId } = req.body;
    const tempRootDir = path.join(process.cwd(), 'temp');

    // 1️⃣ Compile and run the C# code
    const result = await codeService.compileAndRunCSharpCode(
      code,
      tests,
      playerId,
      tempRootDir
    );

    // ✅ Return the cleaned result with stats
    res.json({
      success: result.success,
      stdout: result.stdout,
      stderr: result.stderr,
      stats: result.stats,
      executionTime: result.executionTime
    });
    
  } catch (error) {
    console.error('Error in compileAndRunCSharpCode:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to compile and run code',
      stdout: '',
      stderr: error.message,
      stats: {
        passed: 0,
        failed: 0,
        total: 0,
        executionTime: '0.00'
      }
    });
  }
};

/**
 * Post /api/code/generateCoverageReport
 * @param {object} req 
 * @param {object} res
 * @param {object} req.body
 * @param {string} req.body.code 
 * @param {string} req.body.playerTestDir
 * @returns 
 */
generateCoverageReport = async (req,res )=>{
  try {
    const { playerTestDir  } = req.body;
    if(!playerTestDir){
      return res.status(400).json({ error: "Missing playerTestDir"});
    }
   
    
    const result = await codeService.generateCoverageReport(playerTestDir);
    res.json(
      {
        lineCoverage: result.lineCoverage,
        coverageSummary: result.coverageSummary,
        lineRate: result.lineRate,
        branchRate: result.branchRate
      }
    )

  }catch (err){
    console.error("Error in generateCoverageReport",err);
    res.status(500).json({error: err.message})

  }

}


getChallenge = async (req, res) => {

try{
  const { id } = req.params;
  const result = await codeService.getChallenge(id);
  if (!result.success) {
    return res.status(404).json({ error: result.error });
  }
  res.json(result);
}
catch(error){
    return res.status(500).json({ error: error.message });
}
}
  /**
   * @route POST /api/code/calculateTestLines
   * @desc Calculates total number of non-empty, non-comment lines in a test file
   * @body {string} testCode - Absolute path to player's test file
   */
  async calculateTestLines(req, res) {
    try {
      const { code } = req.body;

      if (!code) {
        return res.status(400).json({
          success: false,
          message: "Missing code parameter",
        });
      }

      const result = await codeService.calculateTestLines(code);
      return res.status(200).json(result);
    } catch (error) {
      console.error("Controller error in calculateTestLines:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to calculate lines of code",
        error: error.message,
      });
    }
  }

  /**
   * @route POST /api/code/generateMutationReport
   * @desc Parses mutation report JSON and returns mutation testing summary
   * @body {string} playerTestsDir - Path to PlayerTests directory
   */
  async generateMutationReport(req, res) {
    try {
      const { playerTestsDir ,projectDir} = req.body;

      if (!playerTestsDir) {
        return res.status(400).json({
          success: false,
          message: "Missing playerTestsDir parameter",
        });
      }

      if(!projectDir){
        return res.status(400).json({
          success: false,
          message: "Missing projectDir parameter",
        });
      }

      console.log(`🧬 Generating mutation Menna for: ${playerTestsDir}`);

      const report = await codeService.generateMutationReport(playerTestsDir,projectDir);

      return res.status(200).json({
        success: true,
        ...report,
      });
    } catch (error) {
      console.error("❌ Controller error in generateMutationReport:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to generate mutation report",
        error: error.message,
      });
    }
  }

}

module.exports = CodeController;