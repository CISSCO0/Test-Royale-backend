const Code = require('../models/code');
const  fs = require("fs");      
const  path =require("path");
const { exec, execSync } = require("child_process");

class CodeService {
  constructor() {}
  /**
   * compile and run CSharp code with coverlet
   * @param {string} code          // base code 
   * @param {string} tests         // test that player worte 
   * @param {string} playerId      // player Id 
   * @param {string} tempRootDir  // dir where we save the compilation and run files 
   * @returns {object}
   */

  async compileAndRunCSharpCode(code, tests, playerId, tempRootDir) {
  let projectDir = null;
  
  try {
    const templateDir = path.join(process.cwd(), "CSharpTemplate");
    const totalTime = Date.now();
    
    // 1️⃣ Ensure temp root exists
    if (!fs.existsSync(tempRootDir)) fs.mkdirSync(tempRootDir, { recursive: true });

    // 2️⃣ Create a unique project folder for this request
    projectDir = path.join(tempRootDir, `player_${playerId}_${Date.now()}`);
    fs.mkdirSync(projectDir, { recursive: true });


    // 3️⃣ Copy template (PlayerCode + PlayerTests folders)
    fs.cpSync(templateDir, projectDir, { recursive: true });

    // 4️⃣ Write BaseCode.cs to PlayerCode project
    const baseCodePath = path.join(projectDir, "PlayerCode", "BaseCode.cs");
    fs.writeFileSync(baseCodePath, code);


    // 5️⃣ Write PlayerTests.cs to PlayerTests project
    const testPath = path.join(projectDir, "PlayerTests", "PlayerTests.cs");
    fs.writeFileSync(testPath, tests);

    
    // 6️⃣ Define directories
    const playerTestsDir = path.join(projectDir, "PlayerTests");
    const playerCodeDir = path.join(projectDir, "PlayerCode");
    
    // 7️⃣ Restore NuGet packages
    console.log("📦 Restoring NuGet packages...");
    try {
      execSync(`dotnet restore "${playerTestsDir}"`, { 
        stdio: "pipe",
        timeout: 30000 
      });
      console.log("✅ NuGet packages restored successfully");
    } catch (restoreError) {
      const errorMsg = restoreError.stderr?.toString() || restoreError.stdout?.toString() || restoreError.message;
      console.error("❌ NuGet restore failed:", errorMsg);
      await this._cleanupProjectDir(projectDir);
      throw new Error(`NuGet Restore Error: ${errorMsg}`);
    }
      
    const timeNow1 = Date.now();


    // 8️⃣ Build the PlayerCode library
    
    console.log("🔨 Building PlayerCode library...");
    try {
      execSync(`dotnet build "${playerCodeDir}"`, { stdio: "pipe" });
      console.log("✅ PlayerCode library built successfully");
    } catch (buildError) {
      // ✅ Parse build error properly
      const errorMsg = buildError.stderr?.toString() || buildError.message || "Failed to build PlayerCode";
      const cleanError = this._parseCompileError(errorMsg, "PlayerCode");
      
      console.error("❌ PlayerCode build failed:", cleanError);
      // Cleanup on build error
      await this._cleanupProjectDir(projectDir);
      
      throw new Error(`Build Error in PlayerCode: ${cleanError}`);
    }

    // 8️⃣ Build the PlayerTests project
    console.log("🔨 Building PlayerTests project...");
    try {
      execSync(`dotnet build "${playerTestsDir}"`, { stdio: "pipe" });
      console.log("✅ PlayerTests project built successfully");
    } catch (buildError) {
      // ✅ Log full error details
      const errorMsg = buildError.stderr?.toString() || buildError.stdout?.toString() || buildError.message || "Failed to build PlayerTests";
      console.error("❌ RAW PlayerTests build error:", errorMsg);
      
      const cleanError = this._parseCompileError(errorMsg, "PlayerTests");
      console.error("❌ PlayerTests build failed (parsed):", cleanError);
      
      // Cleanup on build error
      await this._cleanupProjectDir(projectDir);
      
      throw new Error(`Build Error in PlayerTests: ${cleanError}`);
    }

    // 9️⃣ Run tests - UPDATED with TRX logger to capture Console.WriteLine

    const runCmd = `dotnet test "${playerTestsDir}" --no-build --logger trx`;
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      exec(runCmd, { 
        cwd: playerTestsDir, 
        timeout: 20000, 
        maxBuffer: 10 * 1024 * 1024,
        env: { ...process.env, DOTNET_CLI_CONTEXT_VERBOSE: "false" }
      }, async (error, stdout, stderr) => {
        const endTime = Date.now();
        const executionTime = (endTime - startTime) / 1000;



        // ✅ Extract pass/fail counts from stdout
        const output = stdout?.trim() || "";
        const errorOutput = stderr?.trim() || "";
        
        const passMatch = output.match(/Passed:\s*(\d+)/);
        const failMatch = output.match(/Failed:\s*(\d+)/);
        const totalMatch = output.match(/Total:\s*(\d+)/);
        
        const passed = passMatch ? parseInt(passMatch[1]) : 0;
        const failed = failMatch ? parseInt(failMatch[1]) : 0;
        const total = totalMatch ? parseInt(totalMatch[1]) : 0;
        


        // ✅ NEW: Read TRX file to get Console.WriteLine output
        let consoleOutput = '';
        const testResultsDir = path.join(playerTestsDir, "TestResults");
        
        if (fs.existsSync(testResultsDir)) {
          try {
            const trxFiles = fs.readdirSync(testResultsDir).filter(f => f.endsWith('.trx'));
            if (trxFiles.length > 0) {
              const trxPath = path.join(testResultsDir, trxFiles[0]);
              const trxContent = fs.readFileSync(trxPath, "utf8");
              
              // Extract all <StdOut> content from TRX
              const stdOutMatches = trxContent.match(/<StdOut>([\s\S]*?)<\/StdOut>/g);
              if (stdOutMatches) {
                consoleOutput = stdOutMatches
                  .map(match => match.replace(/<\/?StdOut>/g, '').trim())
                  .filter(text => text.length > 0)
                  .join('\n');
                

              }
            }
          } catch (err) {
            console.warn("⚠️ Could not read TRX file:", err.message);
          }
        }

        // ✅ Clean output - keep test results, add console output
        const cleanedOutput = this._parseTestOutput(output, errorOutput, consoleOutput);


        const results = {
          success: failed === 0,
          stdout: cleanedOutput,  // ✅ Now includes Console.WriteLine
          stderr: errorOutput || (error ? error.message : ""),
          stats: {
            passed,
            failed,
            total,
            executionTime: executionTime.toFixed(2)
          },
          projectDir,
          playerTestsDir,
          executionTime,
        };

        // Schedule cleanup - delay for 10 minutes
        setTimeout(async () => {
          await this._cleanupProjectDir(projectDir);
        }, 600000);

        resolve(results);
      });
    });

  } catch (error) {
    // Ensure cleanup happens even if there's an error
    if (projectDir) {
      await this._cleanupProjectDir(projectDir);
    }
    
    return {
      success: false,
      error: error.message,
      stdout: "",
      stderr: error.message,
      stats: {
        passed: 0,
        failed: 0,
        total: 0,
        executionTime: "0.00"
      }
    };
  }
}

// ✅ NEW: Parse compile errors and extract meaningful messages
_parseCompileError(errorText, project) {
  try {
    // Remove file paths and focus on actual error messages
    const lines = errorText.split('\n');
    const errors = [];
    
    for (const line of lines) {
      // Extract error lines (contain CS followed by numbers)
      if (line.includes('error CS') || line.includes('error ')) {
        // Remove full paths, keep just the error message
        const cleaned = line
          .replace(/^.*error\s*CS\d+:\s*/, '')  // Remove error code prefix
          .replace(/^.*:\s*/, '')                // Remove file path
          .trim();
        
        if (cleaned && !errors.includes(cleaned)) {
          errors.push(cleaned);
        }
      }
    }
    
    return errors.length > 0 
      ? errors.slice(0, 3).join('\n')  // Return first 3 errors
      : `Failed to build ${project}. Check your code syntax.`;
  } catch (err) {
    return `Build failed in ${project}: ${err.message}`;
  }
}

// ✅ UPDATED: Parse test output with TRX console output
_parseTestOutput(stdout, stderr, consoleOutput = '') {
  try {
    // ✅ If we have console output from TRX, prioritize it
    if (consoleOutput && consoleOutput.trim().length > 0) {
      // Get test summary from stdout
      const passMatch = stdout.match(/Passed:\s*(\d+)/);
      const failMatch = stdout.match(/Failed:\s*(\d+)/);
      const totalMatch = stdout.match(/Total:\s*(\d+)/);
      
      const summary = [];
      if (totalMatch) summary.push(`Total tests: ${totalMatch[1]}`);
      if (passMatch) summary.push(`Passed: ${passMatch[1]}`);
      if (failMatch) summary.push(`Failed: ${failMatch[1]}`);
      
      // Combine console output with test summary
      const finalOutput = [
        consoleOutput,
        '\n--- Test Results ---',
        summary.join('\n')
      ].join('\n');
      
      return finalOutput;
    }

    // Fallback: Parse stdout directly (old behavior)
    if (!stdout || stdout.trim().length === 0) {
      return 'No test output captured';
    }

    const linesToSkip = [
      'Test run for',
      'test files matched',
      '.NETCoreApp',
      'Version=v',
      '.dll',
      'Starting test execution',
      'VSTest',
      'XUnit',
      'TestPlatform',
      'Logging Vstest',
      'Logging TestHost'
    ];

    const lines = stdout.split('\n');
    const cleaned = lines
      .filter(line => {
        const trimmed = line.trim();
        
        // Skip if it's a path
        if (/^[A-Z]:\\/.test(trimmed) || /^\/[A-Za-z]/.test(trimmed)) {
          return false;
        }
        
        // Skip if it matches VSTest keywords
        if (linesToSkip.some(skip => trimmed.includes(skip))) {
          return false;
        }
        
        // Skip completely empty lines
        if (trimmed === '') {
          return false;
        }
        
        return true;
      })
      .map(line => line.trim())
      .join('\n');

    return cleaned.length > 0 ? cleaned : 'No output captured';
  } catch (err) {
    return consoleOutput || stdout || 'Test execution completed';
  }
}
/**
 * Generate coverage report for player's BaseCode.cs
 * @param {string} playerTestsDir - Directory containing player's test results
 * @returns {Promise<{ success: boolean, lineCoverage: Array, coverageSummary: number, lineRate: number, branchRate: number, error?: string }>}
 */
async generateCoverageReport(playerTestsDir) {
  try {


    // ✅ Validate playerTestsDir exists
    if (!fs.existsSync(playerTestsDir)) {
      throw new Error(`PlayerTests directory not found: ${playerTestsDir}`);
    }

    // ✅ Get base code path and validate
    const baseCodePath = path.join(playerTestsDir, "..", "PlayerCode", "BaseCode.cs");
    if (!fs.existsSync(baseCodePath)) {
      throw new Error("BaseCode.cs not found");
    }

    const baseCode = fs.readFileSync(baseCodePath, "utf8");
    const totalBaseCodeLines = baseCode.split("\n").length;

    // Initialize coverage array
    const lineCoverage = Array.from({ length: totalBaseCodeLines }, (_, i) => ({
      line: i + 1,
      covered: false,
      file: "BaseCode.cs"
    }));

    const testResultsDir = path.join(playerTestsDir, "TestResults");


    // ✅ Run coverage collection
    const runCmd = `dotnet test "${playerTestsDir}" --collect:"XPlat Code Coverage" --logger "trx;LogFileName=test_results.trx" --no-build`;
    try {
      execSync(runCmd, { cwd: playerTestsDir, stdio: "pipe", timeout: 20000 });

    } catch (err) {
      console.warn("⚠️ Coverage run failed, attempting to parse existing results:", err.message);
    }

    // ✅ Find coverage file
    if (!fs.existsSync(testResultsDir)) {
      console.warn("⚠️ TestResults directory not found, returning base coverage data");
      return {
        success: true,
        lineCoverage,
        coverageSummary: 0,
        lineRate: 0,
        branchRate: 0
      };
    }

    const coverageFile = this.findCoverageFile(testResultsDir);
    if (!coverageFile) {
      console.warn("⚠️ No coverage file found");
      return {
        success: true,
        lineCoverage,
        coverageSummary: 0,
        lineRate: 0,
        branchRate: 0
      };
    }



    // ✅ Parse XML safely
    let xml;
    try {
      xml = fs.readFileSync(coverageFile, "utf8");

    } catch (err) {
      throw new Error(`Failed to read coverage file: ${err.message}`);
    }

    // ✅ Extract global coverage rates
    const lineRateMatch = xml.match(/line-rate="([\d.]+)"/);
    const branchRateMatch = xml.match(/branch-rate="([\d.]+)"/);
    const lineRate = lineRateMatch ? parseFloat(lineRateMatch[1]) * 100 : 0;
    const branchRate = branchRateMatch ? parseFloat(branchRateMatch[1]) * 100 : 0;


    // ✅ Extract BaseCode.cs block
    const fileMatch = xml.match(/<class[^>]*filename="[^"]*BaseCode\.cs"[^>]*>[\s\S]*?<\/class>/);
    if (!fileMatch) {
      console.warn("⚠️ No coverage data for BaseCode.cs found");
      return {
        success: true,
        lineCoverage,
        coverageSummary: lineRate.toFixed(1),
        lineRate,
        branchRate
      };
    }

    const baseCodeXml = fileMatch[0];
    const lineRegex = /<line number="(\d+)" hits="(\d+)"/g;

    // ✅ Parse coverage safely
    let match;
    let coveredLines = 0;
    let validLines = 0;

    while ((match = lineRegex.exec(baseCodeXml)) !== null) {
      const line = Number(match[1]);
      const hits = Number(match[2]);

      if (line >= 1 && line <= totalBaseCodeLines) {
        validLines++;
        if (hits > 0) {
          coveredLines++;
          lineCoverage[line - 1].covered = true;
        }
      }
    }

    const coverageSummary = validLines > 0 
      ? ((coveredLines / validLines) * 100).toFixed(1)
      : 0;



    return {
      success: true,
      lineCoverage,
      coverageSummary: parseFloat(coverageSummary),
      lineRate,
      branchRate
    };

  } catch (error) {
    console.error("❌ Coverage generation failed:", error.message);
    return {
      ...defaultResponse,
      error: error.message
    };
  }
}

/**
 * Helper function to find coverage file recursively
 * @param {string} testResultsDir - Test results directory
 * @returns {string|null} Path to coverage file or null
 */
findCoverageFile(testResultsDir) {
  try {
    if (!fs.existsSync(testResultsDir)) {
      console.warn("⚠️ Test results directory does not exist:", testResultsDir);
      return null;
    }

    const files = fs.readdirSync(testResultsDir, { withFileTypes: true });

    for (const entry of files) {
      const fullPath = path.join(testResultsDir, entry.name);

      try {
        if (entry.isDirectory()) {
          const nested = this.findCoverageFile(fullPath);
          if (nested) return nested;
        } else if (
          entry.name.endsWith(".coverage") || 
          entry.name.endsWith(".xml") || 
          entry.name === "coverage.cobertura.xml"
        ) {

          return fullPath;
        }
      } catch (err) {
        console.warn("⚠️ Error processing file:", entry.name, err.message);
        continue;
      }
    }

    return null;
  } catch (error) {
    console.error("❌ Error searching for coverage file:", error.message);
    return null;
  }
}
/**
 * returnes number of meaningful test lines
 * @param {string} code 
 * @returns 
 */
async calculateTestLines(code) {
  try {
    const cleaned = code
      .replace(/\/\*[\s\S]*?\*\//g, "")  // block comments
      .replace(/\/\/.*$/gm, "");         // single-line comments

    const lines = cleaned
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0 && line !== "{" && line !== "}");


    return {  success: true ,totalTestLines: lines.length};
  } catch (error) {
    console.error("❌ Error calculating test lines:", error);
    return { success: false, error: error.message, totalTestLines: 0 };
  }
}


async generateMutationReport(playerTestsDir,projectDir) {


  try {
    // Create solution and run Stryker (assumes dotnet-stryker is already installed globally)

  // Create solution if missing
const solutionPath = path.join(projectDir, "TempSolution.sln");
const tempDir = path.dirname(playerTestsDir); // temp folder containing PlayerCode and PlayerTests
const playerCodeProj = path.join(tempDir, "PlayerCode", "PlayerCode.csproj");
const playerTestsProj = path.join(playerTestsDir, "PlayerTests.csproj");



// always recreate solution
if (fs.existsSync(solutionPath)) {
  fs.unlinkSync(solutionPath);
}

execSync(`dotnet new sln -n TempSolution`, { cwd: projectDir });
execSync(`dotnet sln "${solutionPath}" add "${playerCodeProj}"`, { cwd: projectDir });
execSync(`dotnet sln "${solutionPath}" add "${playerTestsProj}"`, { cwd: projectDir });

    // Run Stryker mutation testing (assumes dotnet-stryker is pre-installed globally)
    const command = `dotnet stryker --solution "${solutionPath}" --test-project "${playerTestsProj}" --reporter json --output "${projectDir}/StrykerOutput"`;
    const strykerResult = await runStrykerCommand(command, [], playerTestsDir);
  const strykerOutputDir = path.join(projectDir, "StrykerOutput");

  // Try to find timestamped folder first
  const timestampedFolders = fs.readdirSync(strykerOutputDir)
    .filter(f => fs.statSync(path.join(strykerOutputDir, f)).isDirectory())
    .sort()
    .reverse();

  // Determine report path // Determine report path (supports both .json and .js)
const possibleReportFiles = [
  path.join(strykerOutputDir, timestampedFolders[0], "reports", "mutation-report.json"),
  path.join(strykerOutputDir, timestampedFolders[0], "reports", "mutation-report.js"),
  path.join(strykerOutputDir, "reports", "mutation-report.json"),
  path.join(strykerOutputDir, "reports", "mutation-report.js")
];

const reportPath = possibleReportFiles.find(f => fs.existsSync(f));

if (!reportPath) throw new Error("Report file not found");

  const data = JSON.parse(fs.readFileSync(reportPath, "utf8"));


  // 5️⃣ Extract mutants
  const mutants = Object.values(data.files || {}).flatMap(file =>
    (file.mutants || []).map(m => ({
      id: m.id,
      mutation: m.mutatorName || m.replacement,
      originalCode: m.replacement,
      line: m.location?.start?.line,
      status: m.status,
      fileName: file.language || "BaseCode.cs"
    }))
  );

  const killed = mutants.filter(m => m.status === "Killed").length;
  const survived = mutants.filter(m => m.status === "Survived").length;
  const timeout = mutants.filter(m => m.status === "Timeout").length;
  const noCoverage = mutants.filter(m => m.status === "NoCoverage").length;
  const totalMutants = mutants.length;
  const mutationScore = totalMutants > 0 ? ((killed / totalMutants) * 100).toFixed(1) : "0";

  return {
    success: true,
    mutants,
    summary: { totalMutants, killed, survived, timeout, noCoverage, mutationScore: parseFloat(mutationScore) }
  };

} catch (error) {
  console.error("❌ Mutation testing failed:", error);
  return {
    success: false,
    error: error.message,
    mutants: [],
    summary: { totalMutants: 0, killed: 0, survived: 0, timeout: 0, noCoverage: 0, mutationScore: 0 }
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
      const challenge = await Code.findById(challengeId).lean();

      if (!challenge) {
        return { success: false, error: 'Challenge not found' };
      }

      return {
        success: true,
        challenge: {
          id: challenge._id,
          title: challenge.title,
          description: challenge.description,
          baseCode: challenge.baseCode,
          testTemplate: challenge.testTemplate,
          createdAt: challenge.createdAt,
          time : challenge.time 
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

/**
 * Get a random challenge
 * @returns {Object} Random challenge
 */
async getRandomChallenge() {
  try {
    const count = await Code.countDocuments();
    if (count === 0) {
      return {
        success: false,
        error: 'No challenges found'
      };
    }

    const randomIndex = Math.floor(Math.random() * count);
    const challenge = await Code.findOne().skip(randomIndex);

    return {
      success: true,
      challenge: {
        id: challenge._id,
        title: challenge.title,
        description: challenge.description,
        baseCode: challenge.baseCode,
        testCases: challenge.testCases,
        testTemplate: challenge.testTemplate,
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
   * Clean up temporary project directory
   * @param {string} projectDir - Directory to clean up
   * @private
   */
  async _cleanupProjectDir(projectDir) {
    try {
      if (fs.existsSync(projectDir)) {
        await fs.promises.rm(projectDir, { recursive: true, force: true });

      }
    } catch (error) {
      console.error(`❌ Failed to clean up ${projectDir}:`, error);
    }
  }
}

module.exports =  CodeService;