import React from "react";
import { render, screen } from "@testing-library/react";

import App from "./App";

jest.mock("socket.io-client", () => ({
  __esModule: true,
  io: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    connected: false,
  })),
}));

jest.mock("react-webcam", () => {
  const mockReact = require("react");

  return mockReact.forwardRef((props, ref) => {
    if (ref) {
      ref.current = {
        getScreenshot: () => null,
      };
    }

    return <div data-testid="mock-webcam" />;
  });
});

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ status: "ok" }),
    }),
  );
});

afterEach(() => {
  jest.clearAllMocks();
});

test("renders the translator hero", async () => {
  render(<App />);
  expect(await screen.findByText(/real-time asl translation without the extra visual noise/i)).toBeInTheDocument();
  expect(screen.getByTestId("mock-webcam")).toBeInTheDocument();
});
