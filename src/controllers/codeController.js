import fetch from "node-fetch";

const PISTON_API_URL = "https://emkc.org/api/v2/piston/execute";

const PISTON_RUNTIMES = {
  python: { language: "python", version: "3.10.0" },
  cpp: { language: "cpp", version: "10.2.0" },
};

export const codeExecution = async (req, res) => {
  const { language, code } = req.body;
  if (!language || !code) {
    return res
      .status(400)
      .json({ output: "Missing 'language' or 'code' in request body." });
  }

  const runtime = PISTON_RUNTIMES[language];
  if (!runtime) {
    return res
      .status(400)
      .json({ output: `Language "${language}" is not supported.` });
  }

  const payload = {
    language: runtime.language,
    version: runtime.version,
    files: [{ content: code }],
  };

  try {
    const response = await fetch(PISTON_API_URL, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Piston API responded with status ${response.status}. See server logs for details.`
      );
    }

    const result = await response.json();

    const compileOutput = result.compile?.stderr || "";
    const runOutput = result.run?.stdout || "";
    const runError = result.run?.stderr || "";

    let output = "";
    if (compileOutput) {
      output += `--- Compilation Error ---\n${compileOutput}`;
    } else if (runError) {
      output += `--- Runtime Error ---\n${runError}`;
    } else if (runOutput) {
      output += runOutput;
    } else {
      output = "Execution finished with no output.";
    }

    return res.json({ output });
  } catch (error) {
    return res.status(500).json({
      output: error.message || "An internal server error occurred.",
    });
  }
};
