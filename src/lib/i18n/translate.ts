// Pure — no "server-only" — so it can run in both Server and Client
// Components. `Dictionary` is the shape both locale dictionaries (en, sv)
// are checked against, defined independently of them so string values stay
// widened to `string` (not each locale's own literal text).

export interface Dictionary {
  common: {
    cancel: string;
    noPermission: string;
    invalidData: string;
  };
  nav: {
    brand: string;
    rooms: string;
    schedule: string;
    myBookings: string;
    admin: string;
    logout: string;
    login: string;
    signup: string;
    language: string;
    menu: string;
  };
  layout: {
    title: string;
    description: string;
  };
  auth: {
    login: {
      heading: string;
      subtitle: string;
      noAccount: string;
      createHere: string;
      emailLabel: string;
      passwordLabel: string;
      submit: string;
      submitPending: string;
    };
    signup: {
      heading: string;
      subtitle: string;
      alreadyHaveAccount: string;
      loginLink: string;
      nameLabel: string;
      emailLabel: string;
      passwordLabel: string;
      passwordHint: string;
      submit: string;
      submitPending: string;
    };
    errors: {
      nameRequired: string;
      invalidEmail: string;
      passwordTooShort: string;
      passwordRequired: string;
      accountExists: string;
      wrongCredentials: string;
    };
  };
  rooms: {
    heading: string;
    subtitle: string;
    seeAllToday: string;
    free: string;
    occupied: string;
    freeUntil: string;
    freeAllDay: string;
    occupiedUntil: string;
    capacity: string;
    screen: string;
    whiteboard: string;
  };
  roomDetail: {
    backToRooms: string;
    prevWeek: string;
    nextWeek: string;
    scheduleHeading: string;
    bookTitle: string;
    editTitle: string;
    close: string;
    ownSuffix: string;
    bookedLabel: string;
    occupiedLabel: string;
    editTime: string;
  };
  dateNav: {
    showToday: string;
    pickDate: string;
  };
  bookingStatus: {
    preliminary: string;
    needsConfirmation: string;
    confirmed: string;
    confirm: string;
    confirmPending: string;
    cancelBooking: string;
    cancelling: string;
    cancelConfirmPrompt: string;
    cancelConfirmYes: string;
    pastTooltip: string;
    clickToBookTooltip: string;
    someoneBookingTooltip: string;
    ownBookingTooltip: string;
  };
  bookingForm: {
    purpose: string;
    purposePlaceholder: string;
    from: string;
    to: string;
    pickTime: string;
    submitCreate: string;
    submitCreatePending: string;
    submitEdit: string;
    submitEditPending: string;
  };
  bookingActions: {
    loginRequiredBook: string;
    loginRequiredEdit: string;
    titleRequired: string;
    roomGone: string;
    endBeforeStart: string;
    pastStartCreate: string;
    pastStartEdit: string;
    durationRule: string;
    invalidStartTime: string;
    overlap: string;
    createSuccess: string;
    updateSuccess: string;
    bookingNotFoundOrNotYours: string;
    holdLoginRequired: string;
    holdRoomBooked: string;
    holdSlotTaken: string;
  };
  schedule: {
    heading: string;
    subtitle: string;
    prevDay: string;
    nextDay: string;
    cornerRoom: string;
    cornerTime: string;
    cornerDay: string;
  };
  bookings: {
    heading: string;
    none: string;
    bookARoom: string;
  };
  admin: {
    heading: string;
    subtitle: string;
    minMinutes: string;
    maxMinutes: string;
    stepMinutes: string;
    scheduleLayout: string;
    layoutHorizontal: string;
    layoutVertical: string;
    requireConfirmation: string;
    requireConfirmationHint: string;
    minutesBefore: string;
    minutesAfter: string;
    save: string;
    saving: string;
    roomsHeading: string;
    roomsSubtitle: string;
    manageRooms: string;
    errors: {
      stepPositive: string;
      minPositive: string;
      maxPositive: string;
      invalidLayout: string;
      mustBeZeroOrMore: string;
      minMaxOrder: string;
      mustBeMultipleOfStep: string;
      saved: string;
    };
  };
  adminRooms: {
    backToSettings: string;
    backToRooms: string;
    heading: string;
    subtitle: string;
    addHeading: string;
    existingHeading: string;
    name: string;
    roomNumber: string;
    building: string;
    campus: string;
    capacity: string;
    floorOptional: string;
    hasScreen: string;
    hasWhiteboard: string;
    addSubmit: string;
    addSubmitPending: string;
    editSubmit: string;
    editSubmitPending: string;
    edit: string;
    editHeading: string;
    upcomingBookingsCount: string;
    noUpcomingBookings: string;
    deleteConfirm: string;
    deleteYes: string;
    deleting: string;
    delete: string;
    errors: {
      nameRequired: string;
      nameTooLong: string;
      roomNumberInt: string;
      buildingRequired: string;
      buildingTooLong: string;
      campusRequired: string;
      campusTooLong: string;
      capacityPositive: string;
      floorTooLong: string;
      invalidRoom: string;
      roomGone: string;
      created: string;
      updated: string;
    };
  };
}

/** Dot-separated paths into Dictionary that resolve to a string leaf, e.g. "nav.rooms". */
type PathsToStrings<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : PathsToStrings<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export type TranslationKey = PathsToStrings<Dictionary>;

function getPath(dict: Dictionary, path: string): string {
  const value = path.split(".").reduce<unknown>((node, segment) => {
    if (node && typeof node === "object" && segment in node) {
      return (node as Record<string, unknown>)[segment];
    }
    return undefined;
  }, dict);
  if (typeof value !== "string") {
    throw new Error(`Missing translation for "${path}"`);
  }
  return value;
}

/** Looks up `key` in `dict` and substitutes any `{name}` placeholders from `vars`. */
export function translate(
  dict: Dictionary,
  key: TranslationKey,
  vars?: Record<string, string | number>
): string {
  let result = getPath(dict, key);
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      result = result.replaceAll(`{${name}}`, String(value));
    }
  }
  return result;
}

/** A `t` function with its dictionary already bound in. */
export type T = (key: TranslationKey, vars?: Record<string, string | number>) => string;

export function bindT(dict: Dictionary): T {
  return (key, vars) => translate(dict, key, vars);
}
