// Teaching guidance per lesson: what breaks, the trade-off, a plain-language explanation and a hint.
// Facts follow the lesson bodies in content/lessons/<slug>.mdx. One entry per lesson slug.
import type { LessonGuide } from "@/types/curriculum";

export const lessonGuides: Record<string, LessonGuide> = {
  // Foundations: 1 user, 1 server
  "big-idea": {
    breaks: "Draw boxes without a reason and you build a cache, a queue and shards on day one, pay for complexity you don't need, and can't defend any of it when asked why.",
    tradeoffs: "It takes patience: you start with one server and one database and add a box only after you can name the problem that forces it in, usually the database.",
    explainSimply: "Think of moving into an empty flat. You buy a bed first, a table when you need somewhere to eat, and shelves when the books pile up. A good system grows the same way: each new piece answers a problem you can point to.",
    hint: "Every box in this course appears at the moment something breaks; turn that into the question you ask about each one.",
  },
  "client-server": {
    breaks: "Without a shared server, each phone sees only the photos stored on it, and there is no single place to check passwords, store posts or enforce the rules.",
    tradeoffs: "Many clients share one server, so a thousand phones asking at once means a thousand units of work in one place, and every later scaling problem starts there.",
    explainSimply: "The client is the app on your phone; the server is a computer you run somewhere else. The app asks for something, like your feed, and the server looks it up and sends it back. It works like a shop counter: customers ask, the shopkeeper fetches, and the shopkeeper never calls a customer first.",
    hint: "Think about which side waits quietly until it is asked something.",
  },
  dns: {
    breaks: "Without DNS, users would have to type 203.0.113.10 instead of instagram.com, and every move to a new server would mean telling every user a new number.",
    tradeoffs: "Caching at every step makes lookups near-instant, but a changed IP spreads slowly until old TTLs expire, so teams lower the TTL days before a migration.",
    explainSimply: "People remember names; computers find each other by numbers. DNS turns a name like instagram.com into the server's number, like a directory you call to get a shop's phone number. You note the number down for a while, so the next visit skips the directory.",
    hint: "Every step of a lookup remembers the answer for a while; ask what that memory does when the record changes.",
  },
  "tcp-udp": {
    breaks: "On the raw network a photo upload can arrive with chunks missing or out of order, and the server saves a corrupted image unless something checks, resends and reorders the packets.",
    tradeoffs: "TCP's reliability costs extra round trips, a handshake before any data and waits for resends, which is why live video and games choose UDP and accept lost packets.",
    explainSimply: "Data travels as small packets, and the network may lose or reorder them. TCP is like a careful phone call: the listener confirms each sentence and asks you to repeat anything missed. UDP is like live radio: fast, and a missed word is simply gone.",
    hint: "Ask what a video frame is worth if it shows up half a second late.",
  },
  http: {
    breaks: "Without a shared format, the server can't tell whether the app wants to read the feed or post a photo, and without TLS anyone on the café Wi-Fi can read the password the app sends.",
    tradeoffs: "Setting up TCP and TLS costs round trips before the first byte of data, which is why HTTP/2 reuses one connection and HTTP/3 folds the handshakes together.",
    explainSimply: "HTTP is a fixed layout for every message: what you want, which resource, some extra details, and a status code in the reply. HTTPS is like sending that message in a sealed, tamper-evident envelope to a recipient who must show ID first. Nobody in between can read it or change it without being noticed.",
    hint: "Picture the café Wi-Fi: list what an attacker there might try to do to your messages, and match one TLS guarantee to each.",
  },
  latency: {
    breaks: "Without knowing where time goes, you add app servers while the database is the real bottleneck, and a healthy-looking average hides the 1 in 100 users who wait seconds.",
    tradeoffs: "Running close to maximum throughput uses hardware efficiently, but queues form and latency shoots up, so you trade spare capacity for predictable response times.",
    explainSimply: "Latency is how long one trip takes; throughput is how many trips finish per hour. A supermarket line with one slow cashier moves at that cashier's pace, however many baggers you hire. The average wait also hides the few people stuck behind a problem order, so you watch the slowest 1% too.",
    hint: "You want the number of requests inside the system at any moment; think about which two numbers you already know that could give you that count.",
  },

  // Scaling and traffic: 10k users
  proxy: {
    breaks: "Without a front door, every backend server is exposed to the internet, each one handles TLS and filters bad traffic on its own, and moving a server means changing what clients connect to.",
    tradeoffs: "Every request passes through one more hop, and the proxy is one more component to run and configure, so it must not become a single point of failure.",
    explainSimply: "A reverse proxy is like a company switchboard. Callers dial one public number, and the operator connects them to the right desk without giving out direct lines. A forward proxy is the opposite: an assistant who places calls for you, so the other side only sees the assistant.",
    hint: "Ask whose identity each proxy hides: the people sending requests, or the machines answering them.",
  },
  "load-balancing": {
    breaks: "With 10k users pointed at one server, pages crawl at peak, and when that server crashes or restarts for a deploy, every user gets errors until it comes back.",
    tradeoffs: "The load balancer is one more component in the request path, and unless you run a redundant pair or a managed service it becomes the new single point of failure.",
    explainSimply: "A load balancer is like the person at the entrance of a bank who sends each customer to a free counter. If a counter closes, they stop sending people there until it reopens. Checking which counters are open is called a health check.",
    hint: "If one request takes 5 ms and another takes 5 s, taking turns ignores how busy each server really is; what could you count instead?",
  },
  scaling: {
    breaks: "Stay on one machine and you hit a hard ceiling, with any failure taking the whole app down; add machines while sessions live in server memory and a refresh that lands on another server logs the user out.",
    tradeoffs: "Scaling up needs no code changes but cost rises steeply and one machine stays a single point of failure, while scaling out needs a load balancer, stateless servers and coordination.",
    explainSimply: "Scaling up is buying one bigger, faster delivery van. Scaling out is buying more ordinary vans plus a dispatcher who hands out the parcels. More vans keep going when one breaks down, but only if any van can deliver any parcel.",
    hint: "Think about what a load balancer assumes when it sends your next request to any machine in the pool.",
  },
  cdn: {
    breaks: "Users far from your one data center wait while every photo and script crosses a continent, and your origin serves the same bytes millions of times until a traffic spike overwhelms it.",
    tradeoffs: "Edge copies can go stale after a deploy, a CDN does little for personalised content, and it costs money.",
    explainSimply: "A CDN is like a chain of local warehouses for files that are the same for everyone, such as photos and scripts. Users collect from the nearest warehouse, and only when it lacks an item does it fetch one from the main factory. Most trips stay short and the factory stays calm.",
    hint: "The edge caches by URL; think about how to make sure a new version of a file never shares a URL with the old one.",
  },

  // Communication: many services
  rest: {
    breaks: "Without an agreed contract, the iOS app, the Android app and the website each call the server in their own way, and every server change quietly breaks one of them.",
    tradeoffs: "JSON text is verbose, and fixed endpoints rarely match one screen exactly, so clients either receive data they don't use or make extra calls.",
    explainSimply: "REST gives everything in your app an address, like /users/42 or /posts/7. You act on those addresses with a few standard verbs: GET to read, POST to create, PATCH to edit, DELETE to remove. It's like a library where every book has a shelf code and the desk accepts only a few kinds of request.",
    hint: "Picture a profile screen that needs a name, a photo and three recent posts, and compare what one endpoint returns with what the screen actually uses.",
  },
  grpc: {
    breaks: "With services calling each other thousands of times a second in verbose JSON, CPU and bandwidth go into encoding and parsing text, and a renamed field breaks a caller only when the call fails at runtime.",
    tradeoffs: "Every service couples to the shared .proto schema, so changes must stay backward compatible (never reuse or renumber a field), and the binary messages need tooling to read.",
    explainSimply: "gRPC lets one service call a function in another service as if it were in the same program. Both sides agree on a strict form in advance, so messages travel as compact numbered fields instead of wordy text. It's like two clerks using a pre-printed form with numbered boxes instead of writing letters.",
    hint: "Think about who reads and sends these messages: a backend service with generated code, or a person debugging in a browser?",
  },
  websockets: {
    breaks: "Without a push channel, a chat message sits unseen until the recipient's app asks again, and millions of phones asking every few seconds flood the servers with mostly empty answers.",
    tradeoffs: "Connections are long-lived and stateful, so each server holds thousands of them, clients must reconnect after every drop, and routing a message gets harder.",
    explainSimply: "Normally the app must ask the server for news, so a chat app would keep asking whether anything is new. A WebSocket keeps one line open in both directions, like a walkie-talkie channel. The server can speak the moment a message arrives.",
    hint: "Think about where each user's open connection lives, and what a message from Asha needs to know to reach Ben.",
  },
  microservices: {
    breaks: "With dozens of engineers in one codebase, every release waits on everyone else's changes, and one bad deploy in the comments code takes down login, feed and uploads together.",
    tradeoffs: "You pay with a distributed system: calls cross the network, split data makes cross-service consistency hard, and monitoring, tracing and deployments add heavy operational overhead.",
    explainSimply: "A monolith is one big kitchen where every cook shares one stove and one menu. Microservices are a food court: separate stalls, each with its own cook, menu and storeroom. Stalls can change or close on their own, but customers now need a way in and a way to find the right stall.",
    hint: "Think about what clients and services lose once there is no longer one address to call.",
  },
  "sync-async": {
    breaks: "If posting a photo waits for resizing, follower notifications and analytics before replying, the user stares at a spinner, and an outage in notifications makes uploads fail too.",
    tradeoffs: "Async work gives no immediate result, leaves the system eventually consistent and harder to trace, and needs a queue to carry the messages.",
    explainSimply: "Synchronous is waiting at the counter until your coffee is made. Asynchronous is ordering, taking a token and sitting down; the coffee arrives when it's ready. Wait only when you truly need the answer right now.",
    hint: "For each step, ask whether the user needs its result before the app can say the post is up.",
  },

  // Data: millions of rows
  "sql-nosql": {
    breaks: "Pick a store without asking how the data is read and written, and you end up fighting it: joins it can't do, lookups that won't scale, or money stored without the transactions it needs.",
    tradeoffs: "Relational stores give joins and ACID transactions but take work to spread across machines, while many NoSQL stores give up joins and rich queries in return for flexible shapes and easy scale-out.",
    explainSimply: "A relational database is like a set of spreadsheets with strict columns, where rows in one sheet can point to rows in another. NoSQL covers other storage styles: a giant dictionary, a folder of documents, wide tables spread over many machines, or a web of connections. You pick by how the data looks and how you need to find it.",
    hint: "Picture choosing a store for bank balances and for like counts, and list the questions that make those two choices different.",
  },
  acid: {
    breaks: "Without transactions, a crash halfway through a transfer leaves one account debited and the other untouched, and two withdrawals at the same moment can both spend the same balance.",
    tradeoffs: "The guarantees cost performance, stricter isolation levels are slower, and they get much harder to keep once data spans several machines.",
    explainSimply: "A transaction groups several changes so they all happen or none do. Think of a shop sale: the money goes into the till and the item leaves the shelf, or neither happens. ACID names four promises that keep this safe through crashes and many customers at once.",
    hint: "Think about where each C matters: one applies even with a single database, the other only once data is copied across machines.",
  },
  indexing: {
    breaks: "Without an index, logging in by email scans every row, so the query slows down as the table grows and a burst of logins can pin the database.",
    tradeoffs: "Each index takes extra storage and slows every insert, update and delete, because the index must change too.",
    explainSimply: "An index works like the index at the back of a textbook. Instead of reading every page to find a topic, you look it up in a sorted list and jump straight to the right page. The database keeps a similar sorted list for a column, so it checks a few entries instead of millions of rows.",
    hint: "Ask which column the sorted list is ordered by first, and what happens when a query skips that column.",
  },
  normalization: {
    breaks: "If every feed view joins users and counts likes for each post, the most visited page in the app gets slower as the tables grow.",
    tradeoffs: "Duplicated data reads fast but makes writes heavier and lets copies drift: when someone renames their account, many rows must change.",
    explainSimply: "Normalizing means writing each fact in one place, like keeping a friend's address only in your contacts. Denormalizing means copying it where you need it, like printing it on every envelope in advance. Copies save time when reading but must all be fixed when the address changes.",
    hint: "Think about which pages are read constantly, and what you should check before you start copying data.",
  },
  replication: {
    breaks: "With one database, a surge of feed reads slows every query, and when that machine dies the whole app is down and recent data may go with it.",
    tradeoffs: "Asynchronous replicas lag, so users can see stale data and recent writes can be lost in a failover, while every write still goes through one primary.",
    explainSimply: "Replication keeps copies of the same data on several machines. One machine, the primary, takes every change and passes it on to the others, which answer reads. It's like a teacher writing on the board while students copy it: you can read any student's notebook, but it may be a line behind.",
    hint: "Ask which copy served the refresh, whether it had caught up yet, and which copy is sure to have your comment.",
  },
  sharding: {
    breaks: "Once the data passes what one machine can hold, or writes outpace one primary, more replicas don't help: each one still stores everything and every write still lands on the same primary.",
    tradeoffs: "The shard key is hard to choose, hot keys overload one shard, cross-shard joins and transactions are slow and complex, and adding shards means moving data.",
    explainSimply: "Sharding splits one huge table into pieces and puts each piece on a different machine. It's like a library that keeps authors A to F in one building, G to M in another, and so on. Each building holds less, but you need a rule that says which building to visit.",
    hint: "Think about whether each extra machine holds all of the data or only part of it.",
  },
  consistency: {
    breaks: "Without a clear consistency promise, a user edits their bio, refreshes and sees the old one, and a payment check can read a balance that a deposit hasn't reached yet.",
    tradeoffs: "Strong consistency costs latency and availability because reads must see the latest write everywhere, while eventual consistency is fast but serves stale data for a while.",
    explainSimply: "When data has copies, they don't all change at the same instant. A consistency model is the promise about what you see right after a change: always the newest version, or perhaps an older one for a moment. It's like a price change in a chain of shops, where some branches show the new tag before others.",
    hint: "For each feature, ask what the worst outcome of a read that is a few seconds old would be.",
  },
  cap: {
    breaks: "If you never decide what happens when replicas can't talk, a network partition can let two ATMs pay out the same balance, or freeze a feed that could safely have shown slightly old posts.",
    tradeoffs: "During a partition you either refuse or delay requests to stay correct or answer with possibly stale data, and even when the network is healthy, stronger consistency costs cross-region round trips.",
    explainSimply: "Picture two branches of a shop sharing one stock count over the phone. If the line goes dead, each branch can stop selling until it's back, or keep selling and fix mistakes later. Even when the line works, checking with the other branch before every sale makes each sale slower.",
    hint: "Ask what has to exist before two copies can disagree or lose touch with each other.",
  },
  "object-storage": {
    breaks: "If photos and videos go into the database and through the app servers, the database bloats and the servers spend their bandwidth relaying huge uploads instead of answering API calls.",
    tradeoffs: "You can't edit an object in place or query inside it, and reads are slower than a local disk, so a CDN usually sits in front.",
    explainSimply: "Object storage is a huge, cheap warehouse for files such as photos and videos. Each file gets a label, its key, and the database keeps only that label, not the file. The app can hand a user a short-lived pass to put one file straight into the warehouse.",
    hint: "Think about which machines would have to carry a 20 MB video if the phone sent it to your API first.",
  },

  // Performance and reliability: failure is normal
  caching: {
    breaks: "When a celebrity post goes viral, the database answers the same query millions of times, runs out of CPU and connections, and every user's feed slows down, not just the fans'.",
    tradeoffs: "Cached data can go stale, invalidation is famously hard, RAM is limited, and you must handle stampedes, hot keys and cold starts.",
    explainSimply: "A cache is a small, fast memory that keeps answers you will probably need again. It's like keeping the spices you use daily on the counter instead of fetching them from the storeroom each time. The hard part is noticing when the storeroom version has changed.",
    hint: "After the database changes, the old cached value is the problem; think of the simplest action that guarantees nobody keeps reading it.",
  },
  "message-queues": {
    breaks: "When a million photos are uploaded at once, the resize workers drown and crash, and any photo a worker was halfway through is lost with no record that it needs redoing.",
    tradeoffs: "You run one more system, results arrive later, ordering isn't always guaranteed, and redelivery means the same message can be processed more than once.",
    explainSimply: "A message queue is a waiting line for jobs. The app drops a job in the line and moves on, and workers take jobs as fast as they can. A job is crossed off only after a worker finishes it, so a crash puts it back in line.",
    hint: "Think about what happens if a worker finishes a job but crashes before it says it is done.",
  },
  pubsub: {
    breaks: "If the post service calls notifications, analytics, moderation and recommendations one by one, every new feature means editing and redeploying the post service, and one slow subscriber delays every new post.",
    tradeoffs: "It's hard to trace who reacts to what, subscribers must cope with eventual consistency and with duplicate or out-of-order events, and event formats must evolve carefully.",
    explainSimply: "Pub/sub works like a newsletter. The post service publishes one announcement that a post was created, and every team that subscribed gets its own copy. A new team can subscribe without the sender changing anything.",
    hint: "Picture a pile of jobs to share out versus a news announcement, and count how many receivers get each item in each case.",
  },
  availability: {
    breaks: "Without an availability target, nobody knows whether a two-hour outage is a disaster or acceptable, and a chain of dependencies quietly drags uptime below what you promised.",
    tradeoffs: "Each extra nine cuts allowed downtime 10× and costs far more engineering: redundancy, multi-region deployments, automated failover and no maintenance windows.",
    explainSimply: "Availability is the share of time your app works, written as a percentage like 99.9%. That sounds high, but 99.9% still allows about 8.76 hours of downtime a year. Each extra 9 cuts that by 10× and needs spare copies of everything, so one failure doesn't stop the service.",
    hint: "If each service fails on its own, what has to go right for a request that needs both of them?",
  },
  "timeouts-retries": {
    breaks: "When the ranking service hangs, the feed service's threads wait on it until the feed fails too, and if every client then retries at once, the struggling service gets several times its normal traffic.",
    tradeoffs: "A timeout set too short fails slow but healthy calls and one set too long ties up threads, while every retry adds load and can duplicate a write that isn't idempotent.",
    explainSimply: "A timeout is deciding how long you'll stay on hold before hanging up. A retry is calling back, but if everyone redials the instant the line drops, the switchboard jams. So you wait longer each time, add a random pause, and only redial for problems that might clear up.",
    hint: "Think about how a crowd of clients that failed together should behave, and which requests would cause harm if they ran twice.",
  },
  "circuit-breaker": {
    breaks: "When the recommendations service dies, every feed request waits for its timeout and retries, threads pile up, and the feed service goes down even though only recommendations was broken.",
    tradeoffs: "While the breaker is open, users get a fallback such as cached data or a default instead of the real answer, and you must tune the failure threshold and cooldown.",
    explainSimply: "A circuit breaker works like the trip switch in your fuse box. When a service keeps failing, the breaker trips and the app stops calling it, giving a quick fallback answer instead. Later it checks carefully whether the service has recovered.",
    hint: "The breaker can't stay open forever; think about how it cautiously tests the dependency, and what each result leads to.",
  },
  backpressure: {
    breaks: "During a big ticket release, a service that accepts every request gets slow for everyone, timeouts and retries pile on, and the overload cascades into the services that call it.",
    tradeoffs: "Some users get a fast 503 instead of an answer, and you must tag each request with a criticality level so the least important work is dropped first.",
    explainSimply: "Backpressure is a busy part of the system telling whoever sends it work to slow down. Load shedding goes further: like a lift with a weight limit, it refuses extra passengers so it can still move. It turns away the least important work first, such as recommendations, so checkout keeps working.",
    hint: "Compare slowing down every request with quickly refusing a few, and think about which requests users would miss least.",
  },
  "rate-limiting": {
    breaks: "One scraper or buggy script sending thousands of requests a minute eats the capacity everyone shares, so normal users see slow pages and your cloud bill jumps.",
    tradeoffs: "A local limiter on each instance is fast but approximate, while a global limiter is accurate but needs a highly available shared store such as Redis and more complexity.",
    explainSimply: "A rate limiter gives each client an allowance, such as 100 requests a minute. A common version is a jar that refills with tokens at a steady rate: each request spends one, and an empty jar means come back later. Saved-up tokens let a client send a short burst.",
    hint: "Ask whether each error is about this client's usage or the server's own health, and what that means for when the client should try again.",
  },
  idempotency: {
    breaks: "When the payment response is lost on a flaky network and the app retries, the server sees a brand-new request and charges the customer twice.",
    tradeoffs: "The server must store each key with its result, ideally in the same transaction as the work, deal with repeats that arrive at once or with a different body, and expire old keys.",
    explainSimply: "An idempotent action has the same effect whether you do it once or five times, like setting a thermostat to 21 degrees. Paying is not like that, so the app attaches a unique ID to each payment request and reuses it on every retry. If the same ID arrives again, the server returns the earlier result instead of charging twice.",
    hint: "The key recognises one request sent many times; ask whether two different users sending two different requests looks like that.",
  },

  // System design practice
  "estimation-numbers": {
    breaks: "Skip the rough numbers and you can't tell whether the app needs one server or three hundred, so you shard where one database would do or miss the cache you really need.",
    tradeoffs: "Rounding hard keeps the maths quick enough to say out loud, at the cost of precision, so you state each figure as an assumption that real workloads can change.",
    explainSimply: "Estimation means sizing a system with round numbers before you design it. Like guessing how many chairs a party needs from the guest list, you don't need the exact count, just whether it's ten or a thousand. Rounding to powers of ten lets you do the maths in your head.",
    hint: "Work out 24 × 60 × 60, then ask which power of ten it is closest to.",
  },
  "estimation-formulas": {
    breaks: "Size for an average day and the system falls over in the first minutes of a flash sale or a contest, when traffic runs several times higher.",
    tradeoffs: "Every result rests on stated assumptions such as DAU, actions per user and object size, so one wrong guess flows into every number; saying them aloud lets the interviewer correct you early.",
    explainSimply: "A few simple formulas turn how many users you have into requests per second, disk space and server count. Each one is multiplication and division with round numbers. Like a shop that adds staff for festival weekends, you plan for the busiest hour, not the average.",
    hint: "Count the total actions in a day, spread them over the seconds in a day, then ask how much busier the busiest moments are.",
  },
  "estimation-examples": {
    breaks: "Without running the formulas on real systems, you treat a URL shortener and Google Drive alike because both see about 1k writes a second, and miss that one needs caches while the other needs object storage and a CDN.",
    tradeoffs: "Each example rests on assumed inputs, and small slips compound, such as counting 4 billion records over 10 years instead of 365 billion.",
    explainSimply: "Worked examples run the formulas on real systems so you can see which number is biggest. A link shortener stores tiny records that are read constantly, so fast reads matter most. A file drive gets about the same number of uploads, but each one is far bigger, so storage and bandwidth matter most.",
    hint: "Multiply the daily count by the days in 10 years, then find the smallest power of 62 that beats it.",
  },
  "system-shapes": {
    breaks: "Without spotting the dominant number, you might build a chat system around caches and read replicas when its real load is a nonstop stream of new writes.",
    tradeoffs: "Calling a system one shape is a simplification, so you confirm with the interviewer which number dominates before committing the design to it.",
    explainSimply: "Most systems fall into one of three types. Some serve tiny pieces of data that are read over and over, some store and move huge files, and some take in an endless flood of new writes. Knowing which type you have tells you which tools matter most.",
    hint: "Ask which number explodes for a chat app: reads of the same item, the size of each item, or the sheer count of new items.",
  },
  "final-architecture": {
    breaks: "Learn the blocks one at a time but never assemble them, and you can't explain how a request travels from DNS to the database or why each box sits where it does.",
    tradeoffs: "Every component adds complexity and cost, so each box in the final picture must be justified by the problem it solves.",
    explainSimply: "The final architecture is the whole app on one map. A request finds the front door through DNS, static files come from nearby copies, and API calls pass a gatekeeper to the services, which check a fast memory before the database. Each box sits exactly where its problem shows up.",
    hint: "Ask whether the user needs the resized photo before the app confirms the post, and where the finished files end up.",
  },
  "revision-map": {
    breaks: "If you only reread notes, you recognise every block on the page but freeze when an interviewer describes a problem and waits for you to name the fix.",
    tradeoffs: "Answering from memory is slower and less comfortable than rereading, and the cards you miss keep coming back until you know them.",
    explainSimply: "This is a deck of flash cards, each naming a problem. You say the building block that fixes it, then flip to check. Struggling to remember is what makes the answer stick.",
    hint: "Think of the switch in a house that trips before the wiring catches fire.",
  },
  playbook: {
    breaks: "Without a fixed order, you start drawing boxes at random, spend 20 minutes on requirements or none at all, and never reach the deep dives where most of the signal is.",
    tradeoffs: "It takes discipline and a clock: each early step stays short, about 5 minutes for requirements, to leave 10 to 15 minutes for deep dives.",
    explainSimply: "The playbook is a recipe for a design interview. You pin down what to build, size it, describe it, then dig into the hardest parts. Following the same order every time keeps you calm and covers what interviewers look for.",
    hint: "Think about what you must know before drawing anything, what you must specify next, and what you save for the end.",
  },
  "url-shortener": {
    breaks: "Skip the requirements and numbers and you shard a 500 GB dataset that fits on one PostgreSQL, or pick hash-and-truncate codes that start colliding after a few hundred thousand links.",
    tradeoffs: "Choosing 302 over 301 sends every click to your servers, so you add Redis in front, and the Redis counter needs persistence and a replica so a restart never hands out old IDs.",
    explainSimply: "A URL shortener stores pairs: a short code and the long link it stands for. Each new link takes the next number from a counter, written in a 62-character alphabet so it stays short. When someone clicks, the server looks up the code and sends the browser on to the long link.",
    hint: "Think about what happens on each insert with each method: does it need to check for a clash first?",
  },
  "test-yourself": {
    breaks: "If you only reread lessons, the material feels familiar but won't come back under interview pressure, and you can't tell which topics you have actually forgotten.",
    tradeoffs: "Recall practice is slower and less comfortable than rereading, and wrong answers are part of the process, not a sign it isn't working.",
    explainSimply: "Testing yourself means answering from memory before you look. It's like practising a song without the lyric sheet: harder, but it shows which lines you really know. The cards you miss come back, so your practice goes where it's needed.",
    hint: "Imagine your login lives in one server's memory and the load balancer sends your next request somewhere else.",
  },
};
