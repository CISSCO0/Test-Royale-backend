const express = require('express');
const router = express.Router();
const CodeController = require('../controllers/codeController');

const codeController = new CodeController();

router.get('/:id', codeController.getChallenge);
router.post("/compileAndRunCSharpCode", codeController.compileAndRunCSharpCode);
router.post("/generateCoverageReport",codeController.generateCoverageReport);

router.post("/calculateTestLines",codeController.calculateTestLines);

router.post("/generateMutationReport", 
  codeController.generateMutationReport
);
module.exports = router;
