import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export function uniqueEmail() {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2)}@kth.se`;
}

export type TestUser = {
  name: string;
  email: string;
  password: string;
};

export function makeTestUser(label: string): TestUser {
  return {
    name: `E2E ${label}`,
    email: uniqueEmail(),
    password: "test-password-123",
  };
}

/** Signs up a brand new user via the UI and lands on /rooms, logged in. */
export async function signupViaUi(page: Page, user: TestUser) {
  await page.goto("/signup");
  await page.getByLabel("Namn").fill(user.name);
  await page.getByLabel("E-post").fill(user.email);
  await page.getByLabel("Lösenord").fill(user.password);
  await page.getByRole("button", { name: "Skapa konto" }).click();
  await expect(page).toHaveURL(/\/rooms$/);
}

/** Logs in an existing user via the UI and lands on /rooms. */
export async function loginViaUi(page: Page, user: Pick<TestUser, "email" | "password">) {
  await page.goto("/login");
  await page.getByLabel("E-post").fill(user.email);
  await page.getByLabel("Lösenord").fill(user.password);
  await page.getByRole("button", { name: "Logga in" }).click();
  await expect(page).toHaveURL(/\/rooms$/);
}

export async function logoutViaUi(page: Page) {
  await page.getByRole("button", { name: "Logga ut" }).click();
  await expect(page).toHaveURL(/\/login$/);
}

/** Returns a YYYY-MM-DD string offset by `days` from today (local time). */
export function dateOffset(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Finds the room detail page URL for a seeded room by name, starting from /rooms,
 * and navigates there with the given date query param so booking times are always
 * comfortably in the future.
 */
export async function gotoRoomOnDate(page: Page, roomName: string, dateStr: string) {
  await page.goto("/rooms");
  const link = page.locator("a", { hasText: roomName }).first();
  const href = await link.getAttribute("href");
  if (!href) throw new Error(`Could not find link for room "${roomName}"`);
  await page.goto(`${href}?date=${dateStr}`);
}

export async function fillBookingForm(
  page: Page,
  { title, startTime, endTime }: { title: string; startTime: string; endTime: string }
) {
  await page.getByLabel("Ärende").fill(title);
  await page.getByLabel("Från").selectOption(startTime);
  await page.getByLabel("Till").selectOption(endTime);
  await page.getByRole("button", { name: "Boka rum" }).click();
}
