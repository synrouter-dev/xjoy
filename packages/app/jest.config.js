/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  preset: "ts-jest",
  testMatch: ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.test.tsx"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@xjoy/shared$": "<rootDir>/../shared/src/index.ts",
    "^@xjoy/shared/(.*)$": "<rootDir>/../shared/src/$1",
    "^@xjoy/db$": "<rootDir>/../db/src/db.ts",
    "^@xjoy/db/(.*)$": "<rootDir>/../db/src/$1",
    "^@xjoy/api$": "<rootDir>/../api/src/index.ts",
    "^@xjoy/api/(.*)$": "<rootDir>/../api/src/$1",
  },
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.json" }],
  },
};
