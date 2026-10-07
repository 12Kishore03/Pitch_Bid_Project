
import { useRef, useState } from "react";

const steps = [
  "Basic Information",
  "Auction Schedule",
  "Team Configuration",
  "Player Configuration",
  "Bidding Rules",
  "Registration & Rules",
  "Review & Create",
];

const initialData = {
  auctionName: "",
  category: "",
  visibility: "Public",
  description: "",
  startDate: "",
  registrationDeadline: "",
  endDate: "",
  timeZone: "Asia/Kolkata",
  numberOfTeams: "",
  teamBudget: "",
  minPlayers: "",
  maxPlayers: "",
  teamNaming: "Owner selects",
  maxAuctionPlayers: "",
  playerApproval: "Manual",
  bidIncrement: "",
  bidTimer: "20",
  allowTeamPass: true,
  playerReentry: "Allow",
  bidCancellation: "Creator approval",
  teamRegistration: true,
  playerRegistration: true,
  registrationApproval: "Manual",
  customRules: "",
};

const fieldGroups = [
  [
    {
      name: "auctionName",
      label: "Auction Name",
      placeholder: "e.g. PitchBid Premier League",
      required: true,
    },
    {
      name: "category",
      label: "Auction Category",
      type: "select",
      options: [
        "Local Cricket Tournament",
        "College Cricket Tournament",
        "Corporate Cricket League",
        "IPL-style Auction",
        "Custom Auction",
      ],
      required: true,
    },
    {
      name: "visibility",
      label: "Auction Visibility",
      type: "select",
      options: ["Public", "Private", "Invite Only"],
      required: true,
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      placeholder: "Describe your cricket auction...",
    },
  ],
  [
    {
      name: "startDate",
      label: "Auction Start Date & Time",
      type: "datetime-local",
      required: true,
    },
    {
      name: "registrationDeadline",
      label: "Registration Deadline",
      type: "datetime-local",
      required: true,
    },
    {
      name: "endDate",
      label: "Planned End Date & Time",
      type: "datetime-local",
    },
    {
      name: "timeZone",
      label: "Time Zone",
      type: "select",
      options: [
        "Asia/Kolkata",
        "Asia/Dubai",
        "Europe/London",
        "UTC",
      ],
      required: true,
    },
  ],
  [
    {
      name: "numberOfTeams",
      label: "Number of Teams",
      type: "number",
      min: 2,
      required: true,
    },
    {
      name: "teamBudget",
      label: "Budget Per Team (₹)",
      type: "number",
      min: 1,
      required: true,
    },
    {
      name: "minPlayers",
      label: "Minimum Players Per Team",
      type: "number",
      min: 1,
      required: true,
    },
    {
      name: "maxPlayers",
      label: "Maximum Players Per Team",
      type: "number",
      min: 1,
      required: true,
    },
    {
      name: "teamNaming",
      label: "Team Name Selection",
      type: "select",
      options: ["Owner selects", "Creator assigns"],
      required: true,
    },
  ],
  [
    {
      name: "maxAuctionPlayers",
      label: "Maximum Players in Auction",
      type: "number",
      min: 1,
      required: true,
    },
    {
      name: "playerApproval",
      label: "Player Registration Approval",
      type: "select",
      options: ["Manual", "Automatic"],
      required: true,
    },
  ],
  [
    {
      name: "bidIncrement",
      label: "Fixed Bid Increment (₹)",
      type: "number",
      min: 1,
      required: true,
    },
    {
      name: "bidTimer",
      label: "Bid Timer (seconds)",
      type: "number",
      min: 5,
      max: 120,
      required: true,
    },
  ],
  [
    {
      name: "registrationApproval",
      label: "Registration Approval",
      type: "select",
      options: ["Manual", "Automatic"],
      required: true,
    },
    {
      name: "playerReentry",
      label: "Unsold Player Re-entry",
      type: "select",
      options: ["Allow", "Do not allow"],
      required: true,
    },
    {
      name: "bidCancellation",
      label: "Bid Cancellation",
      type: "select",
      options: ["Creator approval", "Disabled"],
      required: true,
    },
    {
      name: "customRules",
      label: "Additional Auction Rules",
      type: "textarea",
      placeholder: "Enter any additional rules...",
    },
  ],
];

const reviewGroups = [
  {
    title: "Basic Information",
    keys: ["auctionName", "category", "visibility", "description"],
  },
  {
    title: "Auction Schedule",
    keys: ["startDate", "registrationDeadline", "endDate", "timeZone"],
  },
  {
    title: "Teams",
    keys: [
      "numberOfTeams",
      "teamBudget",
      "minPlayers",
      "maxPlayers",
      "teamNaming",
    ],
  },
  {
    title: "Players",
    keys: ["maxAuctionPlayers", "playerApproval"],
  },
  {
    title: "Bidding",
    keys: ["bidIncrement", "bidTimer"],
  },
  {
    title: "Registration & Rules",
    keys: [
      "teamRegistration",
      "playerRegistration",
      "registrationApproval",
      "playerReentry",
      "bidCancellation",
      "allowTeamPass",
      "customRules",
    ],
  },
];

function formatLabel(key) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function formatValue(key, value) {
  if (typeof value === "boolean") {
    return value ? "Enabled" : "Disabled";
  }

  if (!value) {
    return "Not specified";
  }

  if (["startDate", "registrationDeadline", "endDate"].includes(key)) {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleString();
  }

  if (key === "teamBudget" || key === "bidIncrement") {
    return `₹${Number(value).toLocaleString("en-IN")}`;
  }

  if (key === "bidTimer") {
    return `${value} seconds`;
  }

  return value;
}

function CreateAuction() {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({ ...initialData });
  const [error, setError] = useState("");
  const [createdAuction, setCreatedAuction] = useState(null);
  const [copyMessage, setCopyMessage] = useState("");

  const stepRef = useRef(null);

  const updateField = (name, value) => {
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
    setError("");
  };

  const validateStep = (step, checkNative = true) => {
    setError("");

    // stepRef refers to a div, so report validity on the input.
    if (checkNative && step === activeStep && step < 6) {
      const invalidField = stepRef.current?.querySelector(":invalid");

      if (invalidField) {
        invalidField.reportValidity();
        return false;
      }
    }

    const fields = fieldGroups[step] || [];

    for (const field of fields) {
      const value = formData[field.name];

      if (
        field.required &&
        String(value ?? "").trim() === ""
      ) {
        setError(`${field.label} is required.`);
        return false;
      }

      if (field.type === "number" && value !== "") {
        const number = Number(value);

        if (!Number.isFinite(number)) {
          setError(`${field.label} must be a valid number.`);
          return false;
        }

        if (field.min !== undefined && number < field.min) {
          setError(
            `${field.label} must be at least ${field.min}.`
          );
          return false;
        }

        if (field.max !== undefined && number > field.max) {
          setError(
            `${field.label} cannot exceed ${field.max}.`
          );
          return false;
        }
      }
    }

    // Schedule validation
    if (step === 1) {
      const start = new Date(formData.startDate);
      const deadline = new Date(formData.registrationDeadline);

      if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(deadline.getTime())
      ) {
        setError("Please enter valid auction dates.");
        return false;
      }

      if (deadline >= start) {
        setError(
          "Registration deadline must be before the auction starts."
        );
        return false;
      }

      if (formData.endDate) {
        const end = new Date(formData.endDate);

        if (Number.isNaN(end.getTime()) || end <= start) {
          setError(
            "Planned end date must be after the auction starts."
          );
          return false;
        }
      }
    }

    // Team validation
    if (step === 2) {
      if (Number(formData.minPlayers) > Number(formData.maxPlayers)) {
        setError(
          "Minimum players cannot exceed maximum players."
        );
        return false;
      }
    }

    // Registration configuration
    if (step === 5) {
      if (
        !formData.teamRegistration &&
        !formData.playerRegistration
      ) {
        setError(
          "Enable at least one registration type: Team Owner or Player."
        );
        return false;
      }
    }

    return true;
  };

  const validateAllSteps = () => {
    for (let step = 0; step < fieldGroups.length; step += 1) {
      if (!validateStep(step, false)) {
        setActiveStep(step);
        return false;
      }
    }

    return true;
  };

  const nextStep = () => {
    if (!validateStep(activeStep)) {
      return;
    }

    setActiveStep((previous) =>
      Math.min(previous + 1, steps.length - 1)
    );
  };

  const previousStep = () => {
    setError("");
    setActiveStep((previous) => Math.max(previous - 1, 0));
  };

  const goToStep = (index) => {
    if (index < activeStep) {
      setError("");
      setActiveStep(index);
    }
  };

  const createAuction = () => {
    if (!validateAllSteps()) {
      return;
    }

    const auctionId = `PB-${Date.now()}`;
    const baseUrl = window.location.origin;

    const auction = {
      ...formData,
      id: auctionId,
      status: "Upcoming",
      createdAt: new Date().toISOString(),
      registrationLinks: {
        player: `${baseUrl}/join-auction/${auctionId}?role=player`,
        owner: `${baseUrl}/join-auction/${auctionId}?role=owner`,
      },
    };

    // Frontend demo only. This will be sent to Spring Boot later.
    console.log("Auction created:", auction);

    setCreatedAuction(auction);
  };

  const copyLink = async (link, label) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopyMessage(`${label} link copied!`);
    } catch {
      setCopyMessage(
        "Unable to copy automatically. Please select and copy the link."
      );
    }
  };

  const renderField = (field) => {
    const common = {
      id: field.name,
      name: field.name,
      required: Boolean(field.required),
      value: formData[field.name],
      onChange: (event) =>
        updateField(field.name, event.target.value),
      min: field.min,
      max: field.max,
      placeholder: field.placeholder || "",
      className:
        "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100",
    };

    return (
      <div key={field.name} className="space-y-2">
        <label
          htmlFor={field.name}
          className="block text-sm font-semibold text-gray-700"
        >
          {field.label}
          {field.required && (
            <span className="ml-1 text-red-500">*</span>
          )}
        </label>

        {field.type === "textarea" ? (
          <textarea {...common} rows={4} />
        ) : field.type === "select" ? (
          <select {...common}>
            <option value="">Select {field.label}</option>
            {field.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : (
          <input
            {...common}
            type={field.type || "text"}
            step={field.type === "number" ? "1" : undefined}
          />
        )}
      </div>
    );
  };

  // Success screen with two registration links
  if (createdAuction) {
    const { player, owner } = createdAuction.registrationLinks;

    return (
      <div className="min-h-screen bg-blue-50 px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl bg-white p-6 shadow-lg sm:p-10">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700">
              ✓
            </div>

            <h1 className="text-center text-2xl font-bold text-blue-950 sm:text-3xl">
              Auction Created Successfully!
            </h1>

            <p className="mt-3 text-center text-gray-600">
              Share the appropriate registration link with players
              and team owners.
            </p>

            <div className="mt-6 rounded-xl bg-blue-50 p-4">
              <p className="text-sm text-gray-500">Auction Name</p>
              <h2 className="mt-1 text-lg font-bold text-blue-950">
                {createdAuction.auctionName}
              </h2>

              <p className="mt-2 text-sm text-gray-600">
                Auction ID: {createdAuction.id}
              </p>
            </div>

            {/* Player link */}
            {createdAuction.playerRegistration && (
              <div className="mt-6 rounded-xl border border-blue-200 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-100 text-xl">
                    🏏
                  </div>

                  <div>
                    <h3 className="font-bold text-blue-950">
                      Player Registration Link
                    </h3>
                    <p className="text-sm text-gray-500">
                      For players who want to participate.
                    </p>
                  </div>
                </div>

                <input
                  readOnly
                  value={player}
                  className="mt-4 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-3 text-sm text-gray-700"
                  onFocus={(event) => event.target.select()}
                />

                <button
                  type="button"
                  onClick={() => copyLink(player, "Player")}
                  className="mt-3 w-full rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800"
                >
                  Copy Player Link
                </button>

                <p className="mt-2 text-xs text-gray-500">
                  Players will enter their personal details and
                  their own base price during registration.
                </p>
              </div>
            )}

            {/* Owner link */}
            {createdAuction.teamRegistration && (
              <div className="mt-5 rounded-xl border border-indigo-200 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-100 text-xl">
                    👥
                  </div>

                  <div>
                    <h3 className="font-bold text-blue-950">
                      Team Owner Registration Link
                    </h3>
                    <p className="text-sm text-gray-500">
                      For people who want to register and manage a team.
                    </p>
                  </div>
                </div>

                <input
                  readOnly
                  value={owner}
                  className="mt-4 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-3 text-sm text-gray-700"
                  onFocus={(event) => event.target.select()}
                />

                <button
                  type="button"
                  onClick={() => copyLink(owner, "Team Owner")}
                  className="mt-3 w-full rounded-lg bg-indigo-700 px-5 py-3 font-semibold text-white transition hover:bg-indigo-800"
                >
                  Copy Team Owner Link
                </button>

                <p className="mt-2 text-xs text-gray-500">
                  The registered owner will automatically become
                  the first player of their own team and won't
                  need separate player registration.
                </p>
              </div>
            )}

            {copyMessage && (
              <p role="status" className="mt-4 text-center text-sm text-green-700">
                {copyMessage}
              </p>
            )}

            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <strong>Frontend demo:</strong> These links are
              generated for display and copying. Registration
              pages and server-side role validation still need
              to be implemented.
            </div>

            <button
              type="button"
              onClick={() => {
                setFormData({ ...initialData });
                setActiveStep(0);
                setError("");
                setCopyMessage("");
                setCreatedAuction(null);
              }}
              className="mt-6 w-full rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Create Another Auction
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progress = Math.round(
    ((activeStep + 1) / steps.length) * 100
  );

  return (
    <div className="min-h-screen bg-blue-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-4xl">
        {/* Heading */}
        <div className="mb-8">
          <p className="font-semibold uppercase tracking-wider text-blue-700">
            PitchBid
          </p>

          <h1 className="mt-2 text-3xl font-bold text-blue-950 sm:text-4xl">
            Create New Auction
          </h1>

          <p className="mt-2 text-gray-600">
            Configure your cricket auction, teams, players and
            bidding rules.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-6 rounded-xl bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-blue-800">
              Step {activeStep + 1} of {steps.length}
            </span>

            <span className="text-sm text-gray-500">
              {progress}% complete
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-blue-700 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {steps.map((step, index) => (
              <button
                key={step}
                type="button"
                onClick={() => goToStep(index)}
                disabled={index >= activeStep}
                className={`rounded-lg px-2 py-2 text-left text-xs font-medium transition ${
                  index === activeStep
                    ? "bg-blue-700 text-white"
                    : index < activeStep
                    ? "bg-blue-50 text-blue-800 hover:bg-blue-100"
                    : "cursor-not-allowed bg-gray-50 text-gray-400"
                }`}
              >
                <span className="mb-1 block">
                  {index < activeStep ? "✓" : `0${index + 1}`}
                </span>
                {step}
              </button>
            ))}
          </div>
        </div>

        {/* Step form */}
        <div className="rounded-2xl bg-white p-5 shadow-lg sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-blue-950">
              {steps[activeStep]}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {activeStep === 6
                ? "Review your configuration before creating the auction."
                : "Fill in the details below to continue."}
            </p>
          </div>

          {activeStep < 6 ? (
            <div
              ref={stepRef}
              className="grid grid-cols-1 gap-5 sm:grid-cols-2"
            >
              {fieldGroups[activeStep].map(renderField)}

              {/* Bidding information */}
              {activeStep === 4 && (
                <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900 sm:col-span-2">
                  The timer resets to the full configured duration
                  after every valid bid. A separate bid extension
                  is not used.
                </div>
              )}

              {/* Registration toggles */}
              {activeStep === 5 && (
                <div className="space-y-4 sm:col-span-2">
                  <label className="flex items-center gap-3 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={formData.teamRegistration}
                      onChange={(event) =>
                        updateField(
                          "teamRegistration",
                          event.target.checked
                        )
                      }
                      className="h-4 w-4 accent-blue-700"
                    />
                    Allow Team Owner registration
                  </label>

                  <label className="flex items-center gap-3 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={formData.playerRegistration}
                      onChange={(event) =>
                        updateField(
                          "playerRegistration",
                          event.target.checked
                        )
                      }
                      className="h-4 w-4 accent-blue-700"
                    />
                    Allow Player registration
                  </label>

                  <label className="flex items-center gap-3 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={formData.allowTeamPass}
                      onChange={(event) =>
                        updateField(
                          "allowTeamPass",
                          event.target.checked
                        )
                      }
                      className="h-4 w-4 accent-blue-700"
                    />
                    Allow teams to pass on a player
                  </label>
                </div>
              )}
            </div>
          ) : (
            /* Review screen */
            <div className="space-y-6">
              {reviewGroups.map((group) => (
                <section key={group.title}>
                  <h3 className="mb-3 border-b border-gray-100 pb-2 font-semibold text-blue-800">
                    {group.title}
                  </h3>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {group.keys.map((key) => (
                      <div key={key}>
                        <p className="text-xs text-gray-500">
                          {formatLabel(key)}
                        </p>

                        <p className="mt-1 break-words text-sm font-medium text-gray-900">
                          {formatValue(key, formData[key])}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          {/* Validation error */}
          {error && (
            <p
              role="alert"
              className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          {/* Navigation buttons */}
          <div className="mt-8 flex flex-col-reverse justify-between gap-3 border-t border-gray-100 pt-6 sm:flex-row">
            <button
              type="button"
              onClick={previousStep}
              disabled={activeStep === 0}
              className="rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            {activeStep < 6 ? (
              <button
                type="button"
                onClick={nextStep}
                className="rounded-lg bg-blue-700 px-8 py-3 font-semibold text-white transition hover:bg-blue-800"
              >
                Continue →
              </button>
            ) : (
              <button
                type="button"
                onClick={createAuction}
                className="rounded-lg bg-blue-700 px-8 py-3 font-semibold text-white transition hover:bg-blue-800"
              >
                Create Auction
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateAuction;
