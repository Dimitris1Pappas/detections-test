// Example test so you can see the test setup works.
// Run with: npm test
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { SearchBox } from "./SearchBox";

function Harness() {
  const [value, setValue] = useState("");
  return (
    <>
      <SearchBox value={value} onChange={setValue} />
      <output>{value}</output>
    </>
  );
}

test("reports what the user types", async () => {
  render(<Harness />);
  await userEvent.type(screen.getByLabelText("Search"), "kite");
  expect(screen.getByRole("status")).toHaveTextContent("kite");
});
