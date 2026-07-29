/** Fetch and index the public manifest. */

export async function loadManifest(url = "manifest.json") {
  const response = await fetch(url, { cache: "no-cache" });
  if (!response.ok) {
    throw new Error(`manifest ${url}: HTTP ${response.status}`);
  }
  const data = await response.json();
  return index(data);
}

export function index(data) {
  const byCode = new Map();
  const byId = new Map();
  for (const clip of data.clips) {
    byCode.set(clip.path_code, clip);
    byId.set(clip.id, clip);
  }
  return {
    ...data,
    byCode,
    byId,
    clipForCode: (code) => byCode.get(code) || null,
    hero: byId.get(data.mosaic.hero_clip_id) || null,
  };
}

export function displayName(clip) {
  const c = clip.credit || {};
  return c.display_name || (c.username ? `@${c.username}` : "anonymous");
}

/**
 * Counts are derived, never written down.
 *
 * The page copy was authored against the first capture -- 18 clips, 17 people
 * -- and was wrong by the time the pipeline finished. More clips are expected
 * (see docs/adding-clips.md), so any number typed into the markup goes stale
 * again. These two read it off the manifest that is already loaded.
 *
 * Angles and people are different numbers: two contributors sent two clips each.
 */
export function angleCount(data) {
  return data.clips.length;
}

export function contributorCount(data) {
  const names = data.clips
    .map((clip) => (clip.credit || {}).username)
    .filter(Boolean);
  return new Set(names).size;
}

/**
 * One entry per person for the credit roll, each carrying every post they sent.
 *
 * Grouped by username rather than by clip, because two contributors sent two
 * angles each and the roll is a list of people, not of files. Sorted by
 * username so the order is the same for everyone and does not shuffle when a
 * new clip is folded in -- an existing name never moves because of someone
 * else's arrival. A clip with no username still gets an entry: an uncredited
 * angle is a bug to see, not one to hide.
 *
 * `posts` holds distinct permalinks. Both of the two-angle contributors put
 * their clips in one Threads reply, so their two angles share a permalink and
 * the roll should offer one link, not the same URL twice. Someone who really
 * does reply twice still gets both.
 */
export function contributors(data) {
  const byUser = new Map();
  for (const clip of data.clips) {
    const credit = clip.credit || {};
    const key = credit.username || clip.id;
    if (!byUser.has(key)) {
      byUser.set(key, {
        key,
        name: displayName(clip),
        profile: credit.profile || null,
        posts: [],
      });
    }
    const person = byUser.get(key);
    if (credit.permalink && !person.posts.includes(credit.permalink)) {
      person.posts.push(credit.permalink);
    }
  }
  return [...byUser.values()].sort((a, b) => a.key.localeCompare(b.key));
}

function parseYmd(text) {
  const m = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/.exec(text.trim());
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return { y, mo, d };
}

function sameDay(a, b) {
  return a.y === b.y && a.mo === b.mo && a.d === b.d;
}

function one(date) {
  return `${date.y}年${date.mo}月${date.d}日`;
}

/**
 * `song.date` is stored the way the show advertised it -- "2026/07/18-2026/07/19"
 * -- which is right for the manifest and unreadable on a title card. Anything
 * this cannot parse is passed through untouched rather than mangled.
 *
 * Written the way a date is written in Taiwan: 年月日, largest unit first, and
 * a range says only the part that changes -- 2026年7月18–19日, not the whole
 * date twice.
 */
export function formatShowDate(raw) {
  if (typeof raw !== "string" || !raw.trim()) return "";
  const text = raw.trim();

  const halves = text.split(/\s*[-–—]\s*/);
  if (halves.length === 2) {
    const from = parseYmd(halves[0]);
    const to = parseYmd(halves[1]);
    if (from && to) {
      if (sameDay(from, to)) return one(from);
      if (from.y === to.y && from.mo === to.mo) {
        return `${from.y}年${from.mo}月${from.d}–${to.d}日`;
      }
      if (from.y === to.y) {
        return `${from.y}年${from.mo}月${from.d}日–${to.mo}月${to.d}日`;
      }
      return `${one(from)}–${one(to)}`;
    }
  }

  const single = parseYmd(text);
  return single ? one(single) : text;
}

/**
 * The caption that tells a stranger what they are looking at. Returns null when
 * the manifest has no song, so the gate simply omits it.
 */
export function songCaption(song) {
  if (!song || !song.title) return null;
  const where = [song.venue, song.tour, formatShowDate(song.date)].filter(Boolean);
  return {
    title: song.artist ? `${song.title} — ${song.artist}` : song.title,
    show: where.join(" · "),
  };
}
