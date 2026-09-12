import { test, expect } from "@playwright/test";
import {
  makeTestUser,
  signupViaUi,
  loginViaUi,
  logoutViaUi,
  gotoRoomOnDate,
  fillBookingForm,
  dateOffset,
} from "./helpers";

const ROOM_NAME = "E2E Testrum 1";

test.describe("Auth", () => {
  test("signup creates an account and lands on the room list", async ({ page }) => {
    const user = makeTestUser("Signup");

    await signupViaUi(page, user);

    await expect(page.getByRole("heading", { name: "Grupprum" })).toBeVisible();
    await expect(page.getByText(ROOM_NAME)).toBeVisible();
  });

  test("a user can log out and log back in", async ({ page }) => {
    const user = makeTestUser("Login");
    await signupViaUi(page, user);

    await logoutViaUi(page);

    await loginViaUi(page, user);
    await expect(page.getByRole("heading", { name: "Grupprum" })).toBeVisible();
  });
});

test.describe("Booking", () => {
  test("a logged in user can book a room and see it under Mina bokningar", async ({ page }) => {
    const user = makeTestUser("Booker");
    await signupViaUi(page, user);

    const date = dateOffset(1);
    await gotoRoomOnDate(page, ROOM_NAME, date);

    await fillBookingForm(page, { dateStr: date, title: "Projektmöte", startTime: "10:00", endTime: "11:00" });

    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByText("10:00–11:00 · Projektmöte (du)")).toBeVisible();

    await page.goto("/bookings");
    await expect(page.getByRole("heading", { name: "Mina bokningar" })).toBeVisible();
    await expect(page.getByText("Projektmöte")).toBeVisible();
    await expect(page.getByText(ROOM_NAME)).toBeVisible();
    await expect(page.getByText(/10:00–11:00/)).toBeVisible();
  });

  test("prevents booking an overlapping slot on the same room", async ({ page }) => {
    const user = makeTestUser("Conflict");
    await signupViaUi(page, user);

    const date = dateOffset(2);
    await gotoRoomOnDate(page, ROOM_NAME, date);

    await fillBookingForm(page, { dateStr: date, title: "Första mötet", startTime: "09:00", endTime: "10:00" });
    await expect(page.getByRole("dialog")).toHaveCount(0);

    // Attempt an overlapping booking on the same room/date (fully containing the first).
    await fillBookingForm(page, { dateStr: date, title: "Andra mötet", startTime: "09:00", endTime: "11:00" });

    await expect(
      page.getByText("Rummet är redan bokat under en del av den valda tiden")
    ).toBeVisible();

    // Only the first booking should exist.
    await page.goto("/bookings");
    await expect(page.getByText("Första mötet")).toBeVisible();
    await expect(page.getByText("Andra mötet")).toHaveCount(0);
  });

  test("a user can cancel their booking", async ({ page }) => {
    const user = makeTestUser("Canceller");
    await signupViaUi(page, user);

    const date = dateOffset(3);
    await gotoRoomOnDate(page, ROOM_NAME, date);

    await fillBookingForm(page, { dateStr: date, title: "Avboka mig", startTime: "11:00", endTime: "12:00" });
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await page.goto("/bookings");
    await expect(page.getByText("Avboka mig")).toBeVisible();

    await page.getByRole("button", { name: "Avboka" }).click();
    await page.getByRole("button", { name: "Ja, avboka" }).click();

    await expect(page.getByText("Avboka mig")).toHaveCount(0);
    await expect(page.getByText("Du har inga kommande bokningar.")).toBeVisible();
  });

  test("shows the booking on the all-rooms schedule overview", async ({ page }) => {
    const user = makeTestUser("Schedule");
    await signupViaUi(page, user);

    const date = dateOffset(4);
    await gotoRoomOnDate(page, ROOM_NAME, date);

    await fillBookingForm(page, { dateStr: date, title: "Schemamöte", startTime: "13:00", endTime: "14:00" });
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await page.goto(`/schedule?date=${date}`);
    await expect(page.getByRole("heading", { name: "Alla rum – schema för dagen" })).toBeVisible();

    // The room name is a link, but the interactive timeline next to it is a
    // sibling, not a child of that link (schedule rows became clickable for
    // inline booking, so the whole row can no longer be one <a>). Go up to
    // the shared row container instead.
    const roomNameLink = page.getByRole("link", { name: ROOM_NAME }).first();
    const roomRow = roomNameLink.locator("..");
    await expect(roomRow.getByText("13:00–14:00 Schemamöte")).toBeVisible();
  });
});
