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

  // Distributed Systems
  "distributed-fundamentals": {
    breaks: "On one machine a call either returns or the process crashes; across a network a call can hang, succeed silently or hit a machine that is alive but unreachable, and code that assumes otherwise double-charges, deadlocks or declares healthy servers dead.",
    tradeoffs: "Every defence against an unreliable network, such as timeouts, retries, acknowledgements and replication, costs latency, duplicates or complexity, so you choose which failures to tolerate rather than eliminating them.",
    explainSimply: "A distributed system is several computers that can only talk by sending messages, and the messages behave like letters: they can be late, lost or arrive twice. Nobody has a master clock, and nobody can see whether a silent neighbour is dead or just slow. Designing for that uncertainty is what this whole track is about.",
    hint: "Think about what a missing reply tells you, then list everything it does not tell you.",
  },
  "time-and-ordering": {
    breaks: "Timestamps from different machines disagree by milliseconds or more, and a process paused by garbage collection wakes up trusting a stale clock, so systems that order writes or expire leases by wall-clock time silently lose data or run two leaders at once.",
    tradeoffs: "Logical clocks add metadata to every message and only give a partial order, while trusting physical time means paying for synchronised clock hardware and waiting out the remaining uncertainty on every commit, as Spanner does.",
    explainSimply: "Imagine friends in different cities keeping one shared diary, each using their own slightly wrong wristwatch. You cannot tell from the watch times who wrote first. If each friend numbers their entries and notes the highest number they have heard from the others, you can work out who knew what when, without trusting any watch.",
    hint: "Think about what a Lamport timestamp promises when a happens before b, and what it cannot promise in the other direction.",
  },
  "quorums": {
    breaks: "Without a rule for how many replicas must answer, a reader can hit the one copy that missed a write and return stale data, and two replicas that accepted different writes to the same key never discover that they disagree.",
    tradeoffs: "Larger quorums make reads fresher but slower and less available, hints and repair add background traffic, and version vectors push conflict merging onto the application instead of silently dropping a write.",
    explainSimply: "Imagine telling your dinner plan to any two of your three flatmates and later asking any two of them what it was. Someone you ask always heard the plan. But if you changed the plan twice through different flatmates at the same time, the two who answer may disagree, and you need a rule for which plan counts.",
    hint: "Draw three circles, shade the two that acknowledged the write and the two you read from, then ask what could break the overlap.",
  },
  "consensus": {
    breaks: "Without consensus two nodes can each believe they are the leader or hold different versions of the same log, so a partition turns into two diverging truths that nobody can merge afterwards.",
    tradeoffs: "Every committed write costs a round trip to a majority, a cluster of 2f + 1 nodes stops accepting writes when more than f fail, and elections cause short pauses, so consensus is reserved for small, critical metadata rather than bulk data.",
    explainSimply: "Picture a committee that only passes a motion when more than half its members sign it, with every meeting numbered. Two different motions can never both pass in one meeting, because someone would have had to sign both. A member who was out of the room sees the meeting number and knows to catch up before voting.",
    hint: "Count how many nodes two majorities of five must have in common, then ask who can win a vote without holding that node's log.",
  },
  "leader-election": {
    breaks: "Two processes that both believe they are the leader run the same job twice, write conflicting data or send duplicate payments, and the lease that was meant to prevent it cannot wake a paused process to tell it that it lost.",
    tradeoffs: "A short lease detects a dead leader quickly but causes needless failovers on every slow heartbeat, a long one leaves the job unattended, and fencing only works if every system the leader writes to is changed to check the token.",
    explainSimply: "Think of a library with one key to the archive, lent out for an hour at a time. If the borrower falls asleep and the key is reissued to someone else, the sleeper wakes up still believing the archive is theirs. The fix is a door that checks the latest key number instead of trusting whoever is holding a key.",
    hint: "Ask who can still tell the paused leader that it has lost, and notice that it is not the lease; it has to be whatever receives the writes.",
  },
  "distributed-locks": {
    breaks: "A lock key with a TTL expires while its holder is paused or slow, a second worker takes the lock and both write to the same resource; a plain DEL on release can also remove a lock that now belongs to someone else.",
    tradeoffs: "Every distributed lock is a lease, so you pay either for a consensus round trip plus a fencing check on the resource, or you accept that under pauses and clock shifts two holders can briefly overlap.",
    explainSimply: "A distributed lock is a hotel key card that expires at check-out, so a room is never stuck forever if a guest disappears. The catch is that an oversleeping guest does not notice the card has expired, and the next guest is let in while they are still inside. A safe system has the room itself check whose turn it is.",
    hint: "Think about what the holder knows at the moment its lease expires, and who else could do the checking.",
  },
  "distributed-transactions": {
    breaks: "Without an atomic commit protocol a change across two databases can commit on one side and fail on the other, and the committed side is durable and cannot be undone.",
    tradeoffs: "Participants hold locks from prepare until the decision arrives, the slowest participant sets everyone's latency, and a coordinator crash leaves them blocked in doubt unless the coordinator's log is replicated with consensus.",
    explainSimply: "Two-phase commit is a wedding: the officiant asks each person 'do you?' and only after both say 'I do' declares them married. Having said 'I do', neither can walk away until the declaration is made. If the officiant faints in between, everyone stands at the altar waiting.",
    hint: "Think about what each participant has promised, and where the only copy of the decision lives.",
  },
  "sagas": {
    breaks: "A business transaction that spans several services cannot be rolled back once one service has committed, so a failure half-way leaves reserved stock, taken payments or half-created orders behind.",
    tradeoffs: "You give up isolation and atomic rollback: other transactions see intermediate states, every step and compensation must be idempotent, and some actions can only be compensated semantically rather than undone.",
    explainSimply: "A saga is how you book a trip across several companies: flight, then hotel, then taxi, each a separate booking. If the hotel is full you do not rewind time; you cancel the flight and accept the fee. Each booking has a matching cancellation, and the trip ends either fully booked or fully cancelled.",
    hint: "Think about what a cancellation does that a rewind would not, and what happens if the cancellation request is sent twice.",
  },
  "linearizability": {
    breaks: "Without linearizability two nodes can both read free and both take the last seat or the lock, and a user can be told a fact by a friend that their own refresh then denies.",
    tradeoffs: "Every linearizable read or write goes through a leader or quorum round trip and must refuse or wait during a partition, so the guarantee is bought per object, not for the whole system.",
    explainSimply: "Imagine a scoreboard that every fan in the stadium sees at the same instant: when it changes, nobody can still see the old score. Weaker promises are like news spreading through a crowd, where everyone eventually hears the result but some people hear it later than their friends. Linearizability is the single-scoreboard promise, and it needs everyone to check with the scoreboard rather than the crowd.",
    hint: "Think about which guarantee mentions real time, which mentions transactions, and the name for the one that does both.",
  },

  // Database Internals
  "storage-engines": {
    breaks: "Without pages and a buffer pool every row lookup is a random disk read, and without the right row or column layout an analytics scan drags whole rows through memory to use three columns.",
    tradeoffs: "Fixed pages waste space and amplify small writes, RAM spent on the buffer pool is RAM taken from everything else, and a column store's fast scans come with slow single-row updates.",
    explainSimply: "A database keeps its data in fixed-size pages, like a warehouse that only moves whole pallets. Asking for one item still brings a pallet, so the database parks the most-used pallets by the door, which is the buffer pool. Row stores pack each order on one pallet; column stores pack all the prices together, which is better for reports.",
    hint: "Think about what the disk actually moves, and where recently used pages wait.",
  },
  "wal": {
    breaks: "Without a log the engine must write every dirty page at commit, which is slow and still leaves half-written pages after a crash; without checkpoints the log grows unbounded and recovery replays all of it.",
    tradeoffs: "Every commit pays for a disk flush, full-page images and logical detail inflate the log, and frequent checkpoints trade shorter recovery for extra I/O.",
    explainSimply: "Before changing anything on disk, the database writes a one-line note describing the change in a diary, then confirms your transaction. If the power fails, it reads the diary and redoes what was lost. Every so often it tidies up and marks a page in the diary as the new starting point.",
    hint: "Think about what gets flushed at commit, what gets written later, and where replay starts.",
  },
  "btree-vs-lsm": {
    breaks: "Pick a B-tree for a firehose of writes and random page rewrites saturate the disk; pick an LSM tree for a latency-sensitive read workload without tuning compaction and reads wander across many files while stalls appear at peak write load.",
    tradeoffs: "Every engine pays in some mix of read, write and space amplification: B-trees pay on writes, size-tiered LSM pays in space and reads, leveled LSM pays by rewriting data at every level.",
    explainSimply: "A B-tree is a filing cabinet: each change goes straight into its folder, so finding things is quick but filing is slow when folders fill up. An LSM tree is an inbox tray: everything lands on top instantly and gets sorted into bundles later. The tray is faster to fill; the cabinet is faster to search.",
    hint: "Ask whether the workload is dominated by writes or reads, then think about what keeps reads from checking every file.",
  },
  "mvcc-isolation": {
    breaks: "Without MVCC every reader waits for every writer on the same rows; with MVCC but without understanding write skew, check-then-act rules that span rows silently break under Repeatable Read.",
    tradeoffs: "Old versions consume space and must be vacuumed or purged, long transactions block that cleanup, and SERIALIZABLE buys correctness with aborts the application has to retry.",
    explainSimply: "The database keeps old copies of a row so that someone reading it never waits for someone changing it; each transaction reads a frozen snapshot, like that morning's newspaper edition. The catch is two people reading the same edition and each making a decision the other did not see. Serializable mode notices that and makes one of them redo their work.",
    hint: "Think about two transactions that read the same rows but write different ones, and about what happens to the rows nobody can see any more.",
  },
  "query-execution": {
    breaks: "Without a planner working from accurate statistics the database full-scans tables or loops an index lookup millions of times, and without reading the plan you optimise blind.",
    tradeoffs: "Every index speeds some reads and slows every write, covering indexes widen the index, and statistics are a sample, so estimates can be wrong exactly on the skewed data that matters.",
    explainSimply: "You tell the database what you want and a planner works out the route, like a satnav choosing between the motorway and side streets. EXPLAIN shows the route and how long each leg really took. If the satnav's map is out of date it picks a bad route, and refreshing the map (statistics) often fixes more than building new roads (indexes).",
    hint: "Compare what the planner expected with what actually happened, and look at how many times the inner loop ran.",
  },
  "replication-internals": {
    breaks: "Ship statements and non-deterministic functions make replicas diverge; recycle WAL a lagging replica still needs and it must be rebuilt; promote a standby without fencing the old primary and two servers accept conflicting writes.",
    tradeoffs: "Physical replication is exact but version-locked, logical replication is flexible but skips DDL and bloats on bulk changes, slots can fill disks, and synchronous commits buy zero loss with latency and availability risk.",
    explainSimply: "Keeping a copy of a database means sending every change somewhere else, and you can send the instruction, the exact bytes, or a plain description of what changed, like mailing a recipe, a frozen kitchen, or a shopping list. If the original fails, a copy takes over, and whatever had not arrived yet is lost. If two copies both accept changes, you need a rule for who wins.",
    hint: "Think about what was acknowledged but not yet sent, and about what crosses the wire in each style.",
  },
  "partitioning-internals": {
    breaks: "Without a plan for secondary indexes every non-key query hits all shards; without a rebalancing strategy adding a node moves most of the data; without routing clients cannot find a moved partition; and a hot key saturates one partition however many you have.",
    tradeoffs: "Global indexes trade write cost and consistency for cheap reads, fixed partition counts trade flexibility for simplicity, dynamic splitting adds hot starts and background movement, and salting multiplies read work to spread writes.",
    explainSimply: "Once data is spread over many machines, new questions appear: how to find things by something other than the filing key, how to add a machine without re-filing everything, and how a request knows which machine to ask. Think of library branches: you can phone every branch, keep a central catalogue that lags a little, hand a new branch whole shelves, and spread one wildly popular book over many branches on purpose.",
    hint: "Think about where the index for a non-key attribute lives, and what a query has to do when it is not where the data is.",
  },
  "distributed-sql": {
    breaks: "A single primary caps write throughput and loses acknowledged writes on failover, while hand-sharding behind a router leaves cross-shard transactions, unique constraints and joins to the application.",
    tradeoffs: "Every write waits for a consensus majority, so latency rises with the distance between replicas, sequential keys create hot ranges, and the cluster needs far more operational care than one server.",
    explainSimply: "Imagine a ledger copied to three towns, where a sale only counts once two of the three clerks have initialled it and a town-hall clock stamps the order of entries. Nothing is lost if one town burns down, but every sale takes a little longer. That is distributed SQL.",
    hint: "Think about what replaces the primary, and what every write has to wait for.",
  },

  // Messaging and Streaming
  "kafka-architecture": {
    breaks: "A classic queue deletes each message once a consumer acks it, so a second consumer never sees the same events, nothing can be replayed after a bug, and ordering is lost on redelivery.",
    tradeoffs: "Keeping every record for days costs disk and moves the what-have-I-handled bookkeeping to each consumer, and strong durability (acks=all with min.insync.replicas=2) adds a wait for a second broker on every write.",
    explainSimply: "Kafka is a numbered ledger that is never erased: new entries go at the end, and each reader keeps a bookmark instead of tearing pages out. The ledger is copied to several machines so losing one loses nothing, and old volumes are shredded after a set time.",
    hint: "Think about who must hold the record before the leader says yes, and what 'everyone in sync' means when only the leader is in sync.",
  },
  "partitions-consumer-groups": {
    breaks: "Without a deliberately chosen key and a sized partition count, related events are processed out of order, consumers beyond the partition count sit idle, and one hot key stalls a single partition while the others are empty.",
    tradeoffs: "Ordering and parallelism pull against each other: a coarse key keeps order but concentrates load, a fine key spreads load but orders less, and changing the partition count later breaks the key-to-partition mapping.",
    explainSimply: "A topic is a row of checkout lanes and each consumer is a cashier who owns a lane. A shopper's items stay in one lane and are scanned in order, extra cashiers with no lane stand about, and one enormous trolley slows its lane however many cashiers you hire.",
    hint: "Count the partitions, then ask what each partition's lag looks like and what happens to a key's partition when you add more.",
  },
  "delivery-semantics": {
    breaks: "Retries after lost acknowledgements and restarts after crashes replay work, so without idempotence or transactions a payment is taken twice, or, if offsets are committed early, a record is silently skipped.",
    tradeoffs: "Every stronger guarantee costs something: idempotence needs state to remember what was seen, transactions add coordinator round trips and hold readers at the last stable offset, and effectively-once needs every sink to cooperate.",
    explainSimply: "Delivering a message is like a chore list and a pen: tick before doing and you may skip one, tick after and you may do one twice, and no pen trick gives you exactly once. The only way out is making the repeat harmless, like noticing the bin is already empty.",
    hint: "Where was the offset when the crash happened, and what would make the second attempt a no-op?",
  },
  "cdc": {
    breaks: "Publishing an event from application code after the commit can lose it when the process dies in the gap, and polling tables for changes misses deletes and out-of-order commits.",
    tradeoffs: "Consumers must tolerate duplicates and apply changes idempotently, a replication slot holds WAL until it is read, and schema changes need discipline because consumers see every column change.",
    explainSimply: "Instead of asking the database what changed, you read its diary: every change it committed, in order, including the things it threw away. Anyone who needs to know, the cache, the search index or the warehouse, reads the diary at their own pace. Nothing is missed because the diary is written before anything else happens.",
    hint: "Think about what happens between a commit and a publish, and where the event could be written instead.",
  },
  "brokers-compared": {
    breaks: "A queue used as an event bus copies every event into every consumer's queue and can never replay, while a log used as a work queue gives head-of-line blocking per partition and no per-message retry.",
    tradeoffs: "Logs give replay and fan-out but order only per partition and offer no per-message routing; queues route and retry each message but delete it on acknowledgement; managed services remove operations at the price of regional throughput ceilings.",
    explainSimply: "A log is a newspaper archive: every issue stays on the shelf and any reader can start from any date. A queue is a post office: each letter goes to one carrier and is gone once signed for. Pick the archive when many people need the same history, the post office when each item is an errand for one person.",
    hint: "Think about who else needs the same message, and whether anyone will ever ask for it again.",
  },
  "stream-processing": {
    breaks: "Windowing by arrival time misplaces delayed events, closing windows too early drops stragglers, and a crash without checkpoints loses every count, session and join buffer the job had built up.",
    tradeoffs: "Waiting longer for late data gives more complete results at higher latency, checkpointing costs snapshot time and barrier alignment, and exactly-once sinks need transactions or idempotent writes that slow the pipeline.",
    explainSimply: "A stream processor is a clerk counting letters by postmark, not by the day they land in the letterbox. At some point the clerk says the Tuesday pile is closed, which is a guess, and keeps a saved copy of the tallies so a dropped ledger does not mean starting from zero.",
    hint: "Separate when it happened from when you saw it, then ask how the job decides a minute is finished and what it saves in case it crashes.",
  },
  "eda-patterns": {
    breaks: "Without agreed event shapes and compatibility rules, consumers break on old records, services issue commands disguised as events and wait for reactions nobody owes them, and the workflow exists only in a running system that nobody can read.",
    tradeoffs: "Fat events trade copies and eventual consistency for consumer autonomy, strict compatibility trades flexibility for safe replay, and an orchestrator trades the loose coupling of choreography for a visible workflow and one more component that can bottleneck.",
    explainSimply: "An event is a notice pinned to the company board: it says what happened, anyone may read it, and each department decides what to do. A command is a memo to one person asking for something. Keep old notices readable, and when the flow matters, appoint someone to run it.",
    hint: "Is the message a fact or a request, who must still read last week's copy of it, and who owns the flow when a step stalls?",
  },

  // Reliability and Observability
  "failure-modes": {
    breaks: "Two replicas in one rack die together when the switch fails, one config service takes down both regions, and a host that answers health checks while timing out real requests keeps getting traffic.",
    tradeoffs: "Every failure domain you span adds latency, replication lag or cost, active-active copies need headroom to absorb a lost peer, and catching grey failure means measuring from the caller's side instead of trusting a health check.",
    explainSimply: "Things break in layers: a flaw turns into a wrong state, which turns into something a user notices. Keeping spare copies only helps if the copies cannot break for the same reason, like keeping a spare house key with a neighbour instead of on the same keyring. Some breakages are sneaky: the server says it is fine while quietly doing a terrible job.",
    hint: "Ask what the copies have in common: the rack, the zone, the dependency, the deploy.",
  },
  "bulkheads-degradation": {
    breaks: "A hung ads service fills the shared thread pool so checkout and search fail with it, a poison request takes down every customer on a shared shard, and under load everything degrades at once, including payments.",
    tradeoffs: "Separate pools waste idle capacity, cells make cross-customer queries and tenant moves hard, kill switches and fallbacks are code paths that rot unless exercised, and every flag carries a maintenance cost.",
    explainSimply: "A ship is divided into watertight compartments so one leak does not sink it. Software does the same: each outside service gets its own small pool of workers, each group of customers gets its own copy of the system, and features come with an off switch so the important ones keep working when the rest are turned off.",
    hint: "Think about what one misbehaving caller or dependency is allowed to use up, and what gets switched off first.",
  },
  "slos-error-budgets": {
    breaks: "Threshold alerts page at night on blips users never notice and stay silent during a slow bleed that eats the whole month's reliability, while product and operations argue about what 'reliable enough' means.",
    tradeoffs: "Good SLIs need measurement at the load balancer or client, a window long enough to be meaningful makes one bad day haunt you for weeks, and an honest budget policy occasionally freezes a launch the business wanted.",
    explainSimply: "An SLO is a promise like 'the app works 999 times out of 1,000 this month'. The one failure in a thousand is your budget, like a monthly data allowance: spend it slowly on experiments or lose it all in one bad afternoon. Alerts should ring when you are spending it far too fast, not on every tiny hiccup.",
    hint: "Think of the SLO as a monthly allowance and ask how fast it is being spent, not whether it has run out.",
  },
  "metrics-monitoring": {
    breaks: "Without the right instruments the team graphs averages that hide the tail, averages percentiles into nonsense, and pages on causes like CPU that nobody can act on at 3 a.m.",
    tradeoffs: "Histograms cost a dozen series per label combination, bounded labels mean you cannot query metrics by user, and symptom-only paging means some causes are found later on a dashboard rather than by a page.",
    explainSimply: "A metric is a number you record over and over: how many requests came in, how many are being handled right now, how long each one took. Think of a car: the odometer only goes up, the speedometer goes up and down, and a tally of journey times sorted into buckets tells you how often a trip was slow. Alerts should work like a smoke alarm, ringing on the smoke rather than on every warm pan.",
    hint: "Ask which quantity you can add across machines: a position in a distribution, or a count of observations in a bucket.",
  },
  "logging": {
    breaks: "Without structure, ids and a budget, an incident means grepping fifty services' prose for a user's name, the log bill outgrows the database, and a token someone logged for debugging sits in cold storage for a year.",
    tradeoffs: "Structured logging needs discipline about field names, sampling means some INFO lines are gone when you want them, and redaction at the source can hide the very value you needed to debug a case.",
    explainSimply: "A log is a diary of what the system did. Writing each entry as a form with labelled boxes rather than a sentence lets you search a million entries in a second. Stamp every entry with the id of the customer's request, keep recent entries close at hand and old ones in a cheap archive, and never write down passwords or card numbers.",
    hint: "Think of a receipt with labelled fields rather than a story, stamped with one order number that follows the request everywhere.",
  },
  "tracing": {
    breaks: "Without propagated context each service records its timings in isolation, so a slow request becomes a nine-way argument, N+1 query storms hide in plain sight, and the one failing request in a thousand leaves no connected record.",
    tradeoffs: "Recording every span of every request is unaffordable, so you sample and lose detail; tail sampling needs stateful collectors; and context must cross every hop, including message queues, or the trace breaks in two.",
    explainSimply: "A trace follows one request like a parcel with a tracking number scanned at every depot. Each service adds its own step with a start and end time, and the tracking number travels in a header so the steps can be stitched together. The result reads like a timeline that shows exactly where the waiting happened.",
    hint: "Think about what has to travel with the request so that two services can agree they worked on the same one.",
  },
  "disaster-recovery": {
    breaks: "Without a tiered plan a regional outage becomes an improvised rebuild, asynchronous replication quietly loses the last seconds of payments, and a backup that was never restored turns out to be unreadable on the worst day.",
    tradeoffs: "Each step down in RTO and RPO means more standing infrastructure in a second region, synchronous replication adds write latency, residency rules can forbid the obvious recovery region, and rehearsals cost real engineering time.",
    explainSimply: "Losing one server is like a flat tyre: the spare gets you going. A disaster is losing the whole car, so you decide in advance how much you can afford to lose and how long you can wait, and keep anything from a saved copy of your route to a second car already running. Then you practise the swap before you need it.",
    hint: "Two numbers decide everything: how much data you can lose, and how long you can be down.",
  },
  "capacity-planning": {
    breaks: "Without headroom a modest spike forms queues and latency explodes, a lost zone overloads the survivors before autoscaling reacts, and connection pools sized for the fast case exhaust the moment the database slows.",
    tradeoffs: "Headroom is paid-for idle capacity, load tests need production-like environments and data, and forecasts are wrong in both directions, so you buy insurance against the expensive mistake rather than the cheap one.",
    explainSimply: "A road at 95% full jams the moment one driver brakes, so you plan traffic with empty lanes to spare. Capacity planning is deciding how many lanes to have for the busiest hour, keeping extra in case one closes, and testing the road with fake traffic to find out where it clogs.",
    hint: "Think of latency as queue length, and ask what happens to a queue as the server gets busier.",
  },
  "incident-response": {
    breaks: "Without roles and a timeline, several people fix the same thing while nobody talks to customers, and without a blameless postmortem the organisation hides causes and repeats the outage.",
    tradeoffs: "Formal roles, status cadences, postmortem reviews and game days cost engineering time on every incident and every quarter, and averages such as MTTR are too noisy to prove the investment is paying off.",
    explainSimply: "An incident is run like an emergency room: triage decides how serious it is, one person leads and does not also operate, one person keeps the chart and one talks to the family. Afterwards the team reviews the chart without blaming anyone and fixes what let the mistake happen. Then they rehearse, so that the next real emergency is not the first time.",
    hint: "Think about the three jobs that must happen at once during an outage and who holds the ones nobody has taken.",
  },

  // Security
  "security-fundamentals": {
    breaks: "Without explicit boundaries and layers, one leaked password or one unchecked endpoint hands an attacker everything, because the design only ever assumed the front door would hold.",
    tradeoffs: "Every layer costs latency, operational work and friction for legitimate users, so you choose where the boundaries are and how many layers each one deserves instead of defending everything equally.",
    explainSimply: "A secure system lets the right people see and change their data and keeps everyone else out, even when part of it is under attack. Think of a bank branch: a lock, a guard, cameras and a vault, each built assuming the one before it has failed. You decide where the doors are and give every key the fewest rooms it needs.",
    hint: "Think of the three A words, and what a new public endpoint does to the attack surface.",
  },
  "authentication": {
    breaks: "Fast unsalted hashes let a stolen table be cracked in hours, a cookie without flags is stolen by one script bug, and a login kept in one server's memory vanishes when the load balancer picks another server.",
    tradeoffs: "Every strengthening costs something: slow hashes burn CPU on each login, server-side sessions need a highly available store, self-contained tokens are hard to revoke, and extra factors add friction and account-recovery problems.",
    explainSimply: "Logging in is like checking in at a hotel: you prove who you are once and get a key card that opens your room until checkout. The card is just a random number the front desk can look up, so losing it is bad but the desk can cancel it instantly. A second factor is the desk also ringing your phone before handing it over.",
    hint: "Where does the session live right now, and where could it live so that any server can find it?",
  },
  "authorization": {
    breaks: "Without per-object checks any authenticated user reads or changes other users' data by editing an id, and without a tenant predicate on every query one customer's bug or malice reads another customer's rows.",
    tradeoffs: "A central policy engine gives one auditable ruleset but becomes a latency and availability dependency, while permissions cached inside tokens are fast but stale until the token expires.",
    explainSimply: "Knowing who someone is does not tell you what they may touch. A badge gets you into the building and onto your floor, but the filing cabinet has its own lock, and whether your key fits depends on what is inside. Software has to check that cabinet lock on every single request.",
    hint: "Ask what was checked (the route) and what was not (the row), and which component could have known.",
  },
  "oauth-jwt": {
    breaks: "Without a standard flow apps collect passwords, codes get intercepted by rogue apps on the same phone, and tokens get accepted by services they were never meant for, or with no signature at all.",
    tradeoffs: "Self-contained tokens are verified locally but cannot be recalled before they expire, so you trade revocation latency for request latency and lean on short lifetimes plus revocable refresh tokens.",
    explainSimply: "Instead of giving a valet your whole key ring, you hand over a valet key that starts the car but will not open the boot, and it stops working at midnight. The dealer who cuts those keys also writes a signed note saying who you are. Anyone who receives such a key checks the signature and the date before trusting it.",
    hint: "Who signed it, for whom, until when, and did you decide the algorithm or did the token?",
  },
  "encryption": {
    breaks: "Encrypting only the disk leaves anyone with a database password reading plaintext, keys kept next to the data protect nothing, and a key nobody backed up turns a routine restore into permanent data loss.",
    tradeoffs: "Each layer costs CPU, a KMS round trip or the ability to index and search the field, and every key you create is something that can be lost, so you encrypt by named attacker rather than everywhere by default.",
    explainSimply: "Locking the warehouse door stops thieves outside; it does not stop someone with a staff badge from reading the files. So you also lock the sensitive drawers, keep those drawer keys in sealed envelopes, and only the vault can open the envelopes. Burn an envelope and that drawer is gone for good, even from the copies.",
    hint: "Name the attacker, then name the layer that stops that attacker and where its key lives.",
  },
  "api-security": {
    breaks: "Without these checks a changed id returns another user's data, a quote in a form field rewrites your SQL, a hostile web page makes a logged-in browser change settings, and a captured webhook is replayed until someone notices.",
    tradeoffs: "Every check adds latency and rejected edge cases, strict validation breaks old clients, tight limits frustrate heavy legitimate users, and signatures and idempotency stores are more state to run.",
    explainSimply: "Think of a post room that checks every parcel: is the address real, is it the right shape and weight, has the same parcel arrived before, and did the courier sign the delivery slip with today's date? None of the checks is clever; the protection comes from doing all of them to every parcel.",
    hint: "Which part of the request proves when it was sent, and what happens if that part is missing?",
  },
  "secrets-management": {
    breaks: "A secret pasted into git, an image or an env file is readable by everyone who can read those, lives forever in forks and caches, and cannot be traced to whoever used it.",
    tradeoffs: "The secrets manager becomes a tier-one dependency at startup, dynamic credentials add database users and connection churn, and rotation needs dual-version rollouts that take engineering time.",
    explainSimply: "Instead of hiding the cupboard key under the mat where everyone knows to look, a desk issues each helper a card that opens only their cupboard for one hour and writes down who used it. Lose a card and little is lost. Nobody ever holds the master key.",
    hint: "Who hands the credential out, how long does it live, and how did the service prove who it was in order to ask?",
  },
  "threat-modelling": {
    breaks: "Without a model you defend the parts you happen to know about, trust the private network because it is private, and discover the abuse case when the ticket bots or the scrapers do.",
    tradeoffs: "Modelling takes time from building and goes stale as the architecture changes, zero trust adds identity and policy machinery to every internal call, and edge DDoS protection is a cost paid before any attack happens.",
    explainSimply: "Threat modelling is walking round the house with a burglar's eyes: list every door and window, and at each one ask who could pretend to be the postman, swap the parcel, sneak a look in, block the door or reach the safe. Then fix the worst ones first, and walk again after every renovation.",
    hint: "Who could pretend to be a service, and who would the log blame?",
  },

  // Cloud and Infrastructure
  "containers": {
    breaks: "Without a packaged, immutable artefact, every server is configured by hand or by drifting scripts, deployments cannot be reproduced and a rollback means guessing what the previous state was.",
    tradeoffs: "Containers share the host kernel, so isolation is weaker than a virtual machine's, and immutability pushes every environment difference into configuration you must inject and manage separately.",
    explainSimply: "A container is like a lunchbox packed at home: everything the meal needs is inside, so it is the same lunch whether you eat it at school or in the park. The box is sealed once packed; for a different lunch you pack a new box rather than fiddling with the old one. Every box still shares the same table.",
    hint: "Think about what is inside the box (filesystem, dependencies) and what every box borrows from the building it sits in.",
  },
  "kubernetes": {
    breaks: "Without an orchestrator nothing replaces a crashed container, callers must track changing Pod IPs by hand, and a rollout that produces a broken version takes the whole service down before anyone notices.",
    tradeoffs: "You take on a control plane, a large YAML surface and probe, request and limit settings that are wrong by default for your workload, which is why most teams run a managed Kubernetes rather than their own.",
    explainSimply: "Kubernetes is a thermostat for software: you say how many copies you want running and how they should be reached, and it keeps adjusting until reality matches. If a copy crashes it starts another, and when you change the version it swaps copies a few at a time, checking each new one works before retiring an old one.",
    hint: "Think about which probe removes a Pod from traffic and which one restarts it.",
  },
  "service-discovery": {
    breaks: "Callers that hold fixed addresses keep sending requests to instances that were replaced or died, and every deployment or scale-down turns into a wave of connection errors.",
    tradeoffs: "The registry becomes a dependency of every request and its view is always slightly stale, so you tune heartbeat intervals between detecting failures quickly and wrongly evicting slow but healthy instances.",
    explainSimply: "Imagine phoning a hospital: you can keep the duty rota in your own phone and call a doctor directly, or dial the switchboard and let it put you through to whoever is on duty. The rota in your phone goes stale; the switchboard must never be engaged. Service discovery is choosing one of those two and keeping the rota fresh.",
    hint: "Think about which part of the answer stays fixed and which part changes with every rollout.",
  },
  "autoscaling": {
    breaks: "A fleet sized by hand is either paying for idle machines or falling over during a spike, and a naive autoscaler oscillates, arrives too late, or scales the web tier past what the database can serve.",
    tradeoffs: "Every defence against lag costs money or latency: headroom and slow scale-in keep idle capacity, stabilisation delays savings, scale to zero makes the first request wait, and a maximum set too low drops traffic.",
    explainSimply: "Autoscaling is a thermostat for servers: when the room gets hot it turns on more cooling, and when it cools down it turns some off. The catch is that the cooling takes minutes to start, so you switch it on early, keep some running just in case, and do not switch it off the moment the temperature dips.",
    hint: "Think about what happens in the minutes between the metric crossing the line and the new machine serving its first request.",
  },
  "multi-region": {
    breaks: "A single region makes every distant user pay a cross-continent round trip and turns a regional outage into a total outage, while a second region added without a data strategy produces conflicting writes or silent data loss at failover.",
    tradeoffs: "Each data strategy pays somewhere: single-writer makes far users wait, geo-partitioning punishes travellers, multi-leader loses conflicting updates and consensus adds a cross-region round trip to every write, on top of doubled infrastructure and transfer cost.",
    explainSimply: "Running in two regions is like a shop chain with branches in two cities: customers go to the nearest branch, and if one burns down the other keeps trading. The hard question is the ledger: one master book the far branch phones into, separate books per customer, two books reconciled later, or no sale recorded until both branches agree.",
    hint: "Think about who is allowed to write each kind of data, and what happens to the last second of writes when a region disappears.",
  },
  "cdn-internals": {
    breaks: "Without deliberate cache keys, tiers and freshness rules, every edge fetches popular objects from the origin independently, a cookie or query string silently splits the cache into useless variants, and an origin outage becomes an immediate user-facing error.",
    tradeoffs: "Every mechanism trades hit ratio against correctness or latency: a richer cache key means more misses, a longer TTL means staler pages, a shield adds a hop, and edge functions add their run time to every request they touch.",
    explainSimply: "A CDN is a chain of branch libraries with a regional depot behind them. Each branch keeps popular books for a set loan period, borrows from the depot rather than the publisher when it runs out, and files books by catalogue number, so if two branches use different numbers for the same book they both order copies. A recall notice pulls a book early.",
    hint: "Think about what makes two requests count as the same object, and who talks to the origin when the copy is missing.",
  },
  "cloud-networking": {
    breaks: "Without private subnets and stateful security groups every server is reachable from the internet, and a single-zone NAT gateway or a stateless rule that forgets ephemeral ports cuts off whole tiers at once.",
    tradeoffs: "Private subnets need NAT gateways that are zonal and charge per gigabyte, PrivateLink endpoints cost per hour per zone, and every extra boundary is another route table and rule set to get wrong.",
    explainSimply: "A VPC is an office building you design: reception lets visitors into the lobby floors only, the mail room sends parcels out from the private floors but accepts none in, and each door lock remembers who it let through. You build one mail room per wing so a flood does not stop the whole building's post.",
    hint: "Think about which route makes a subnet public, and what the private ones use instead.",
  },
  "iac": {
    breaks: "Hand-built environments cannot be reproduced or audited, a change made in the console during an incident silently diverges from the configuration, and recovering in a new region takes days instead of minutes.",
    tradeoffs: "You now operate the tooling: a sensitive state file to protect and lock, plans to review, drift to reconcile, and a pipeline or GitOps agent whose permissions are among the most powerful credentials in the company.",
    explainSimply: "Infrastructure as Code is building from blueprints instead of a foreman's memory: anyone can rebuild the same thing anywhere, and every change to the blueprint is reviewed before the builders act. If someone knocks through a wall without updating the blueprint, an inspection shows the difference, and in GitOps the builders put the wall back.",
    hint: "Think about what the tool must remember between runs, and what goes wrong when two runs happen at once.",
  },

  // Architecture Patterns
  "modular-monolith-soa": {
    breaks: "Without enforced module boundaries every feature reaches into every table, so a change anywhere breaks tests everywhere and the monolith can never be split except by rewriting it.",
    tradeoffs: "Hard boundaries cost indirection and duplicated data inside one process, and a premature split into services adds network failures and operations overhead without buying any independence.",
    explainSimply: "Think of a department store under one roof: shoes, groceries and electronics each keep their own stock and tills, and a shopper walks between them through the aisles. The store does not need to become three separate shops until the queues or the deliveries demand it. A modular monolith is that store; the departments are bounded contexts.",
    hint: "Think about the word 'order' as three different teams would define it, and where the definitions change.",
  },
  "api-gateway": {
    breaks: "Without a gateway each service terminates TLS, validates tokens and rate-limits on its own, clients must know every service address, and a phone pays several round trips per screen.",
    tradeoffs: "The gateway is an extra hop on every request and a single component in front of everything, so it must be stateless and replicated, its timeouts and limits must agree with the backends, and it must be kept free of business logic.",
    explainSimply: "An API gateway is like the reception desk of a large office: it checks your badge, keeps the queue orderly and points you to the right floor, but it does not do the work of any department. A backend-for-frontend is a separate desk for a particular kind of visitor, run by the people who know what that visitor needs.",
    hint: "List the things that are true of every request regardless of what it is for, then notice that business rules are not on the list.",
  },
  "service-mesh": {
    breaks: "Without a mesh, encryption, retry and timeout behaviour is reimplemented in every language and drifts, so one team's aggressive retries and another's missing timeouts combine into cascading failures that nobody can see end to end.",
    tradeoffs: "Every service-to-service call now passes through two proxies, every pod carries a proxy's memory, and a control plane must be run, upgraded and debugged alongside the applications.",
    explainSimply: "Instead of teaching every employee to check IDs, keep records and redial dropped calls, the building puts a trained receptionist at every office door and runs them all from one head office. The employees just do their jobs. The price is a desk at every door and a slightly longer walk for each visit.",
    hint: "List what every service used to do about the network itself, then ask where that work went and what the new component in the path costs.",
  },
  "cqrs": {
    breaks: "Without the split, the same normalised model serves a hot read path with five-table joins and a write path with complex rules, so one grows denormalised copies that break the rules and the other slows every screen.",
    tradeoffs: "Two models mean two codebases to keep in step, projections that lag the write side, and a UI that must cope with not seeing its own write for a moment; applied outside a complex bounded context, that complexity buys nothing.",
    explainSimply: "A restaurant kitchen decides which orders are allowed and cooks them; the boards in the dining room show what is ready, each updated from the kitchen a few seconds behind. Guests read the boards, never the pans. CQRS keeps the deciding and the showing in separate places.",
    hint: "Think about who is allowed to change the data and who only looks at it, and what happens in the gap between a change and the board being updated.",
  },
  "event-sourcing": {
    breaks: "Overwriting rows destroys the history, so audits, 'what did the user see at the time' questions and bug reconstruction become guesswork, and a new report over old data cannot be built because the data no longer exists.",
    tradeoffs: "Events are forever, so every schema change needs versioning or upcasting, erasure requests collide with immutability, reads from projections lag the writes, and set-based queries need a projection before they can be answered.",
    explainSimply: "A bank does not store your balance and scribble over it; it keeps every statement line and works the balance out from them. A mistake is fixed by adding a reversal line, never by editing the past. Event sourcing runs a system the way a bank runs a statement.",
    hint: "Think about how a bank statement gets to a balance, how it corrects a mistake, and why the opening balance at the top saves time.",
  },
  "strangler-fig": {
    breaks: "Without an incremental path a replacement is a multi-year rewrite with a frozen roadmap and a single cut-over, and any attempt to run old and new side by side with dual writes leaves the two databases silently disagreeing.",
    tradeoffs: "Running two systems at once costs a facade, duplicated infrastructure, synchronisation plumbing and a growing pile of flags, all of which must be removed at the end or they become the next legacy system.",
    explainSimply: "Renovate a shop while it keeps trading: fence off one aisle, fit the new one behind the fence, open it, move the stock, take the old aisle down, move the fence. Customers never see a closed shop. The fence is the facade and moving the stock is the data migration.",
    hint: "Think about what sits in front of both systems, what decides which one answers, and who is allowed to write the data at any moment.",
  },
  "serverless": {
    breaks: "Without a per-use platform, bursty or rare workloads need servers provisioned for the peak and paid for at idle, and someone must patch, scale and monitor them.",
    tradeoffs: "Functions are stateless, short-lived and limited in payload and runtime, the first request after idleness pays a cold start, local testing is approximate, the provider's event formats lock you in, and at steady high load per-use pricing costs more than always-on servers.",
    explainSimply: "Taking taxis instead of owning a car: you pay only while riding, never park or service anything, and it is perfect for occasional trips. Sometimes you wait for the taxi to arrive, and if you ride every day it ends up dearer than a car. Serverless is taxis for compute.",
    hint: "Think about what happens to the taxi analogy when the first ride of the day is requested, and what it costs to have one waiting outside.",
  },
  "multi-tenancy": {
    breaks: "In a pool with no per-tenant limits one tenant's load degrades everyone, and a tenant id taken from the URL instead of the token lets any customer read another's rows.",
    tradeoffs: "Dedicated databases and cells multiply migrations, connection pools and idle cost, while pooling demands row-level enforcement, per-tenant limits and metering to know who costs what.",
    explainSimply: "A block of flats shares one building and one boiler, with a meter in each flat and a rule about late parties: that is pooling small customers. A detached house has its own boiler and its own bill: that is a dedicated database for a big or regulated customer. The building manager keeps the list of who lives where.",
    hint: "Think about which two kinds of tenant justify their own building, and what everyone else gets instead.",
  },
  "advanced-revision": {
    breaks: "Without recall practice you recognise every advanced block on the page and still freeze when an interviewer describes the problem and waits, because reading built recognition, not retrieval.",
    tradeoffs: "Flashcards are slower and less comfortable than rereading, and the cards you miss keep returning until you know them; that discomfort is the mechanism.",
    explainSimply: "This page is a deck of cards. Each one describes something going wrong in a big system, and you say which tool fixes it before turning the card over. The table below the deck shows every answer with the lesson it came from.",
    hint: "Think about what a new leader needs that an old one cannot forge.",
  },

  // High-Level Design Case Studies
  "case-study-method": {
    breaks: "Without a shared shape you read every case study from scratch, cannot compare two designs, and in an interview you narrate boxes in whatever order they come to mind.",
    tradeoffs: "A fixed template can feel mechanical, so each case study names the two or three sections where the real difficulty lives and spends its deep dives there.",
    explainSimply: "Every design write-up here uses the same chapter list, the way every recipe lists ingredients before steps. Once you know the chapters you can skip the routine ones and slow down at the hard bits. The chapter order is also the order you would talk in an interview.",
    hint: "Think about what each step needs from the step before it: you cannot size servers before you know the traffic, or pick a database before you know the data.",
  },
  "design-pastebin": {
    breaks: "Putting 180 TB of text bodies in the metadata database makes every backup, replica and vacuum pay for blobs it never queries, and trusting deletion to enforce expiry serves expired pastes from caches and edges for days.",
    tradeoffs: "Two stores can disagree, so the design needs an orphan sweep, an upload path that confirms the body exists before the row goes live, and an unlisted-paste read path that cannot use the CDN.",
    explainSimply: "A pastebin is a left-luggage office. The desk keeps a small ledger of tags and expiry dates, the bags sit on cheap shelves in the back room, and the clerk checks the date before handing a bag over. Popular bags get copied to kiosks around town so the desk is never the queue.",
    hint: "Multiply pastes per day by bytes per paste by days of retention, then compare that with the metadata, and ask which store is built for each.",
  },
  "design-rate-limiter": {
    breaks: "Without shared, atomically updated counters, each gateway instance enforces its own approximate share, two instances can both spend the last token, and a slow or dead counter store either adds tens of milliseconds to every request or takes the whole API down.",
    tradeoffs: "Every request now pays an in-region Redis round trip, accuracy is traded for throughput through local buckets and batching, and rule propagation, canaries and fail-open policy become an operational surface the platform team must own.",
    explainSimply: "Several doormen at different doors of one venue need to share a single head count. They radio a central tally before letting each guest in, turn away anyone obviously over the limit without radioing, and if the radio breaks they count at their own doors for a while instead of locking everyone out.",
    hint: "Think about who updates the counter, how many of them there are, how far away the counter is, and what you would rather do when you cannot reach it.",
  },
  "design-notification-system": {
    breaks: "Calling providers synchronously from the API collapses at a 100× campaign spike, one shared queue puts one-time passwords behind coupons, and at-least-once redelivery sends the same text twice.",
    tradeoffs: "Everything after ingestion is asynchronous and eventually consistent, so the design carries three layers of idempotency, a pacer per provider, a reconciler that polls for stuck statuses, and queues that hold minutes of backlog by design.",
    explainSimply: "Think of a post office sorting floor: sacks of letters come in, get sorted into express and bulk bins for each destination, and leave on trucks that carry a fixed load an hour. Express always boards first, every letter is stamped so it cannot be sent twice, and undeliverable mail goes to a returns shelf instead of being thrown away.",
    hint: "Compare the arrival rate during a campaign with the rate each provider accepts, then ask what sits between them and how urgent work overtakes bulk.",
  },
  "design-key-value-store": {
    breaks: "A single primary refuses every write the moment it is unreachable, and sharding by hash modulo moves almost every key each time a node is added, so neither availability nor incremental growth is possible.",
    tradeoffs: "Staying writeable through a partition means two versions of a key can exist, so the application must merge siblings, deletes become tombstones that cost disk for days, and background hints, read repair and Merkle-tree repair add traffic.",
    explainSimply: "Imagine three flatmates each keeping a copy of the shopping list, where a change counts once two copies have it. If one flatmate is away you leave a sticky note on their door and copy it in when they return. If two people changed the list at the same time, you keep both lists and sort it out together rather than throwing one away.",
    hint: "Draw the key's three home replicas, cut one off, and ask who can still acknowledge a write and what the version vectors look like afterwards.",
  },
  "design-file-storage": {
    breaks: "Whole-file uploads through application servers double the bandwidth bill, cannot resume or deduplicate, and a crash between writing the bytes and writing the metadata leaves files that point at nothing.",
    tradeoffs: "Chunking adds a block index with a hundred million new rows a day, devices must keep cursors and merge conflicts themselves, and the database and object store can only be kept honest by an ordering rule plus a background reconciler.",
    explainSimply: "Think of a file as a recipe listing numbered ingredients kept in a warehouse. If the warehouse already has an ingredient nobody sends it again, a delivery that stops halfway only resumes the missing ones, and the recipe card is only written once every ingredient is on the shelf. Every night someone checks that no recipe mentions an ingredient the warehouse does not have.",
    hint: "Think about what the client sends first, the hashes or the bytes, and what the server can therefore refuse to write.",
  },
  "design-instagram": {
    breaks: "Building each feed by reading 200 followees' posts on every open costs 50M reads a second, pushing every post to every follower lets one celebrity post block the fan-out tier for minutes, and 3,000 likes a second on one row serialize on a lock.",
    tradeoffs: "Fan-out on write spends 2M writes a second and terabytes of RAM to make reads cheap, a follower threshold adds a merge step on every feed read, and Redis counters make like counts approximate for a few seconds.",
    explainSimply: "Deliver every newspaper to subscribers' doors before dawn, except the national dailies, which readers pick up at the newsstand on their way, because one national paper would need a delivery fleet of its own. Photos travel a separate road through warehouses near the readers. Likes are tallied on a notepad and copied into the ledger every few seconds.",
    hint: "Compare the cost of pushing one post to its followers with the cost of 250,000 feed reads each pulling from 200 accounts, then ask which account breaks the average.",
  },
  "design-whatsapp": {
    breaks: "Pushing a message straight to a live connection loses it the moment a gateway dies after the sender saw a tick, and a per-recipient delivery table for 1,024-member groups collapses under eleven million deliveries a second.",
    tradeoffs: "Writing every delivery to an inbox before pushing it costs hundreds of terabytes of short-lived writes a day, and end-to-end encryption forbids server-side search, link previews and cloud recovery of chats.",
    explainSimply: "Think of a post office that only handles sealed envelopes. Every letter goes into the addressee's pigeonhole before anyone tries to hand it over, so nothing is lost if the courier trips. The clerk cannot read the letters, so there is no search desk, only \"give me everything in my pigeonhole, in order\".",
    hint: "Ask where a message lives between the sender's tick and the recipient's ack, and whose device counts the receipts in a group.",
  },
  "design-youtube": {
    breaks: "Pushing bytes through application servers and counting views with row updates collapses the first time a million people watch one video at once, and a single bitrate stalls every viewer on a weak network.",
    tradeoffs: "Pre-transcoding a full ladder costs hundreds of thousands of cores and a storage multiplier for videos nobody may watch, and the counts viewers see are minutes stale and may later be revised.",
    explainSimply: "Think of a bakery that bakes each video once into six loaves of different richness, all sliced at the same marks. Corner shops everywhere keep copies of the slices, so the bakery hardly hears from customers. When your arms get tired you switch to a lighter loaf at the next slice.",
    hint: "Ask what property of a segment lets thousands of caches serve it without asking anyone, and who decides which quality comes next.",
  },
  "design-uber": {
    breaks: "Writing every driver position to a database drowns it in a quarter of a million writes a second that are obsolete in four seconds, and matching without a conditional transaction sends two cars to one rider the first time a dispatcher retries.",
    tradeoffs: "Keeping positions only in memory means a crashed index node forgets a city for a few seconds, sharding trips and drivers by city makes cross-city trips a special case, and offering one driver at a time makes riders wait through declines.",
    explainSimply: "Picture a taxi rank with a whiteboard and a ledger. Drivers shout where they are and the dispatcher scribbles it on the whiteboard, wiping old scribbles as new shouts arrive. When a fare comes in, the dispatcher radios one driver at a time, and only when one says yes writes the fare in the ledger, in ink, against that driver.",
    hint: "Ask which data can be regenerated in four seconds and which data is money, and which shard key lets the trip and the driver change together.",
  },
  "design-netflix": {
    breaks: "Serving a country's prime-time peak from cloud egress or a pull-through CDN pays transit prices for hundreds of terabits a second and makes the first viewer at every edge wait on the origin, while a single-region control plane turns one cloud outage into a dead play button.",
    tradeoffs: "Owning appliances inside a thousand ISPs costs capital, hardware refreshes and a nightly placement forecast whose every error is transit bought at prime time, and three active-active regions each sized for half the peak leave a third of the control plane idle.",
    explainSimply: "Think of a cinema chain that drives tonight's film reels to every cinema the night before, so that at showtime no lorry is on the motorway. The head office only checks your membership card and tells you which screen to go to. If the head office in one city burns down, the one in the next city already has your card on file.",
    hint: "Ask which half of the system knows tomorrow's demand today, and what that lets you do with the bytes before anyone asks for them.",
  },
  "design-ecommerce": {
    breaks: "Checking stock, charging the card and confirming the order as independent writes lets a crash between them oversell, double-charge or lose a paid order, and a flash sale pointed at one inventory row melts the database for everyone.",
    tradeoffs: "Separate services with separate consistency rules mean a saga with compensations instead of one transaction, holds that block real buyers for their TTL, a reconciler for lost webhooks and a cache that may say in stock a few seconds too long.",
    explainSimply: "Picture a shop that hands out numbered tokens at the door for the one item everyone wants and only takes money from token holders, so nobody pays for a phone that is not there; an unused token goes back in the bowl after ten minutes. The shelves may carry an old price sticker for a minute, but the till rings the real one. If the card machine prints a receipt twice, the shop looks up the receipt number and charges you once.",
    hint: "Ask where the single contested number lives, who is allowed to touch it, and what makes a repeated request look identical to the first.",
  },
  "design-ticket-booking": {
    breaks: "Two fans read seat E7 as free in the same millisecond and both are told to pay, or a sale lets 200,000 people hammer the database for 2,000 holds and every show on the platform slows down.",
    tradeoffs: "Holds take seats off the market for ten minutes while carts are abandoned, the seat map is deliberately a second stale, fans wait in a queue even when the site is idle elsewhere, and the write path refuses holds during a database failover rather than risk two owners.",
    explainSimply: "A cloakroom has one attendant and a board of numbered hooks. Everyone in the hall can see the board, a steward lets people in a few at a time, and only the attendant hangs coats, one at a time. If you have not paid for your hook within ten minutes, the coat comes back off.",
    hint: "Separate the three crowds: who looks at the map, who is let in, and who is allowed to write a seat row, then ask which one the database must serve.",
  },
  "design-payment-system": {
    breaks: "Without idempotent attempts and a ledger, a timeout followed by a retry charges a customer twice, a crash between the PSP's answer and our database loses a payment, and a mutable balance column cannot say where the missing ₹24 went.",
    tradeoffs: "Every PSP call costs a committed row before and after, payments sit in a pending state instead of failing fast, the ledger grows forever and is never edited, and a daily reconciliation job and an exceptions queue become permanent parts of the system.",
    explainSimply: "You write a cheque and cannot remember whether you dropped it in the postbox. You do not write a second cheque; you keep the stub, ask the bank using the cheque number, and wait for the statement if you must. The payment system keeps a stub for every call it makes and reads the statement every day.",
    hint: "Ask what you can know for certain right after a timeout, what you wrote down before the call, and who can tell you later what really happened.",
  },
  "design-search-autocomplete": {
    breaks: "Ranking suggestions by querying a database or scanning a sorted list on every keystroke blows the ten-millisecond budget for short prefixes, and rebuilding rankings per request cannot keep up with thirty thousand lookups a second.",
    tradeoffs: "A precomputed index costs about 80 bytes for every prefix anyone types and only changes at the next build, a 60-second edge cache delays every ranking change, anything personalised cannot be cached at the edge, and typo tolerance costs a dozen extra lookups per keystroke.",
    explainSimply: "A librarian keeps a card for every opening phrase they hear, with the ten most-asked titles on it, and answers from the card instead of searching the shelves. The cards are rewritten each night from the day's requests, and a sticker goes on when everyone suddenly asks about the same thing.",
    hint: "Ask what work can be done before anyone types, what must be done the instant they type, and what must be done the moment someone reports a bad suggestion.",
  },

  // Low-Level Design: Foundations
  "lld-intro": {
    breaks: "Without a low-level design, the first developer to open the box invents the classes under deadline, responsibilities land wherever the cursor was, and every later change means reading the whole component to find out who owns what.",
    tradeoffs: "Every class, interface and pattern is a boundary that must be named, understood and tested, so more structure buys flexibility at the price of indirection and more files to read.",
    explainSimply: "High-level design decides which buildings a campus needs and which roads join them. Low-level design is the floor plan of one building: which rooms exist, what each is for, and which doors connect them. You settle the rooms before anyone lays a brick.",
    hint: "List the artefacts in the order you would draw them on a whiteboard, then the four things a reviewer would tick off.",
  },
  "oop-pillars": {
    breaks: "Without encapsulation and abstraction every rule is enforced at the call site, so a negative balance or a vendor-specific exception leaks into the whole codebase and each new type adds another branch to every switch.",
    tradeoffs: "Hiding state and dispatching through interfaces adds indirection: an operation spread across many classes is harder to read than one switch, and an interface for a single implementation is ceremony.",
    explainSimply: "Think of a vending machine. You press a button and a drink appears; you cannot reach into the coin box, and you do not know whether a spiral or a belt moved the can. Objects work the same way: they hide their insides and promise only what their buttons do.",
    hint: "Which pillar is about who may change an object's state, and what single sentence should the fix guarantee?",
  },
  "class-relationships-uml": {
    breaks: "Without a shared notation for ownership, lifetime and count, two developers read 'the order has lines' differently, and one of them writes code that orphans or deletes data the other expected to keep.",
    tradeoffs: "Diagrams take time to draw and go stale as code changes, so draw only the classes, relationships and one or two flows that carry a decision.",
    explainSimply: "A class diagram is a family tree plus an address book: who is a kind of whom, and who keeps whose number. A sequence diagram is the transcript of one phone call, read top to bottom. The first says who knows whom; the second says who called whom, and in what order.",
    hint: "A filled versus a hollow diamond is about whether the parts survive the whole; then read each number at the far end of the line.",
  },
  "composition-over-inheritance": {
    breaks: "A subclass inherits its parent's internals as well as its contract, so a parent that calls its own overridable methods, or gains a method in the next release, silently changes what the subclass does.",
    tradeoffs: "Composition costs forwarding boilerplate, an extra object to construct and wire, and one more interface to read, which is pure overhead when the behaviour never varies.",
    explainSimply: "Extending a class is like building your extension on a neighbour's foundation: when they re-lay the floor, your walls crack. Holding the class in a field is like building next door with a corridor between the houses: you only depend on where their front door is. The corridor still breaks if they move the door, but not when they redecorate.",
    hint: "Who calls the overridden add when addAll runs, and whose code does the wrapper version call instead?",
  },
  "solid": {
    breaks: "Without a rule for where code belongs, every change ripples: three teams edit one class, each new case reopens working code, subclasses surprise their callers and tests need real infrastructure.",
    tradeoffs: "Each principle adds a class, an interface or a layer of indirection, which is pure overhead until the second case or the second team shows up.",
    explainSimply: "Think of a well-run kitchen: one cook per station, a new dish is a new recipe card rather than a rewritten menu, any trained cook can cover any station without the diners noticing, the waiter's pad shows only what the waiter needs, and the head chef asks for 'a fridge' rather than one brand of fridge. SOLID is those five habits, for code.",
    hint: "Ask who constructs the store and which way the dependency arrow points, then name the principle about arrows.",
  },
  "interfaces-abstractions-di": {
    breaks: "A class that constructs its own collaborators cannot be tested without them, hides what it depends on, and has to be edited whenever the database, the mailer or the clock changes.",
    tradeoffs: "Someone must now build and wire the object graph, either by hand in a composition root or with a container that hides the graph and moves wiring errors to runtime.",
    explainSimply: "A good chef does not build the oven; the kitchen is fitted out before service and the chef just cooks. Dependency injection fits a class out with what it needs before it does any work, from one place near the front door. Swap the oven and the recipe does not change.",
    hint: "Three places: where the contract is declared, how it arrives, and the single spot that knows the real class.",
  },
  "design-patterns-creational": {
    breaks: "Without a creational pattern the class that uses an object also decides its concrete type, so every new type edits working code and no test can substitute a fake.",
    tradeoffs: "Every pattern adds at least one interface and one class, and a Singleton's convenient global access hides dependencies and makes tests order-dependent.",
    explainSimply: "Instead of making every part of a program build the things it needs, you hand the building to a specialist. It is like ordering at a restaurant counter: you say what you want, and the kitchen decides who cooks it and how. The program only has to know what it asked for.",
    hint: "Think about what must stay consistent across several objects, not just how one object gets created.",
  },
  "design-patterns-structural": {
    breaks: "Without these patterns, vendor APIs leak into business logic, cross-cutting concerns such as retries and metrics get copied into every method, and tree-shaped data needs a special case for every level.",
    tradeoffs: "Each wrapper is another layer to read, debug and keep consistent, identity checks on wrapped objects break, and a facade can quietly grow into the class that does everything.",
    explainSimply: "These patterns are ways of putting one object inside another so the outside world sees a tidier shape. A travel plug changes the socket shape, a phone case adds protection without changing the phone, and a receptionist decides who gets through to the manager. Same move, three different reasons.",
    hint: "The shape is identical; think about the reason the wrapper was written.",
  },
  "design-patterns-behavioural": {
    breaks: "Without these patterns, algorithms, lifecycles and notifications are hard-coded as conditionals and direct calls, so every new rule edits working code and nothing can be tested alone.",
    tradeoffs: "Each pattern trades a conditional for more classes and indirection, and Observer adds hidden control flow whose ordering and failure behaviour are easy to get wrong.",
    explainSimply: "These patterns are about who does what, and who needs to know. Instead of one big recipe full of 'if this customer, do that', each rule becomes its own small card you can swap in. A restaurant order slip is one such card: it can be queued, handed on or cancelled.",
    hint: "Think about where the rules for one status live now, and where they would live if each status were a class.",
  },
  "concurrency-basics": {
    breaks: "Shared mutable state without coordination produces wrong counts, corrupted collections and flags that other threads never see, and the bugs appear only under load and vanish in the debugger.",
    tradeoffs: "Locks cost contention and risk deadlock, atomics cover only one variable, immutability costs copies, and bounded pools and queues force you to decide what happens when they are full.",
    explainSimply: "When two people edit the same sticky note at once, one edit gets lost. You can give each person their own note, use a note that updates in one stroke, or have one pen that only one person holds at a time. Trouble starts when two people each hold a pen the other needs.",
    hint: "Count the steps hidden inside the ++ and ask what another thread can do between them.",
  },
  "error-handling": {
    breaks: "Errors that are swallowed, returned as null or logged without context surface far from their cause, let callers continue on bad state, and turn a transient timeout into a double charge when retried blindly.",
    tradeoffs: "Result types make every call site unwrap and change when outcomes are added, exceptions hide control flow, and retries cost duplicate work unless the operation is idempotent.",
    explainSimply: "Decide in advance what happens when something goes wrong, instead of letting it happen somewhere random. Check inputs once at the door, like airport security, and trust them inside. When something fails deeper in, pass the problem up with a note attached rather than hiding it.",
    hint: "Think about whether the caller will branch on the outcome or cannot continue at all.",
  },
  "clean-code": {
    breaks: "Code that hides its intent behind short names, magic numbers and flags is misread by the next person, so changes take longer and introduce bugs a clear name would have prevented.",
    tradeoffs: "Extracting and naming everything can fragment a simple algorithm into many tiny hops, so every rule here bends to the question of what the reader would rather see.",
    explainSimply: "Write code the way you would write a good recipe: ingredients named up front, steps at the same level of detail, and a note explaining the one odd instruction. The person cooking next is probably you in a year, and you will not remember why 0.82.",
    hint: "Think about what the call site reads like, and whether a true in it tells the reader anything.",
  },
  "testing-extensibility": {
    breaks: "Code that reaches for the real clock, real databases and global singletons can only be tested slowly and end to end, so bugs are found late and refactoring is feared.",
    tradeoffs: "Every seam is an interface and a double to maintain, and tests that mock every interaction become a second copy of the implementation that breaks on every refactor.",
    explainSimply: "A unit test tries one small part of a program on its own, with the slow or unpredictable bits swapped for stand-ins, the way a film uses a stunt double for a dangerous scene. Design that allows the swap also allows new features to be added without touching what already works.",
    hint: "Think about what the class reaches for on its own, and what it could be handed instead.",
  },

  // Low-Level Design: Case Studies
  "lld-parking-lot": {
    breaks: "Without one owner of spot state and an atomic claim, two gates can issue tickets for the same bay, and pricing rules hard-coded into the lot change every time finance changes its mind.",
    tradeoffs: "Two Strategy interfaces and a per-spot atomic flag add classes, make 'nearest free spot' best-effort under contention, and the in-memory design must move to a database once gates span machines.",
    explainSimply: "Picture a car park where every bay has a light that turns red the instant a car is sent to it. Gate staff pick from the green bays, and the light switches so fast that two gates can never pick the same one. How bays are chosen and how much you pay are separate rule books that can be rewritten without touching the bays.",
    hint: "Separate what the lot has from what the lot decides, then ask at which exact moment a spot stops being free.",
  },
  "lld-vending-machine": {
    breaks: "A machine whose insert, select and cancel methods each switch on a status field scatters one state's rules across the class, so a new state or a failed dispense edits every method and one missed branch gives away stock or swallows money.",
    tradeoffs: "One class per state and an explicit transaction object are more files than an enum and a switch, and holding the machine's lock through a slow dispense keeps the keypad busy until the item drops.",
    explainSimply: "A good shopkeeper behaves differently depending on where you are in the sale: before you have paid, after you have paid, while they fetch the item. Here each of those moods is its own little rule book, and the till and the shelf stay the same whichever rule book is open. The shopkeeper also checks the change drawer before handing anything over.",
    hint: "One class per state, then ask which object must remember the money when the state changes.",
  },
  "lld-elevator": {
    breaks: "A controller that serves the nearest request first starves far floors under steady traffic, and one that mixes dispatch, stop ordering and safety checks in a single loop cannot change any of them without risking the others.",
    tradeoffs: "Two strategy interfaces, a mode guard and a lock per car add indirection, LOOK saves travel but makes waits less predictable than SCAN, and a discrete tick model hides acceleration and door timing.",
    explainSimply: "A lift that always went to whoever is closest would leave the person on the top floor waiting while people on the middle floors kept pressing buttons. So a lift keeps going in one direction, stopping for everyone on the way, and turns round only when nobody further along is waiting. Deciding which lift answers a button, where that lift stops next, and whether it is safe to move are three separate jobs.",
    hint: "Three decisions, three objects: who answers the call, where the car stops next, and whether it may move at all.",
  },
  "lld-library-management": {
    breaks: "With one Book object carrying a status, three copies of the same title cannot be told apart, so a reservation cannot queue for 'any copy', a lost copy takes the whole title with it, and two desks can lend the same barcode twice.",
    tradeoffs: "Two objects where most people draw one means an available-count per title for search results, a copy status that is a cache of loans and holds and must change in step with them, and extra classes for per-tier policies and listeners.",
    explainSimply: "A library has one catalogue entry for a book and several physical copies of it on the shelf. You queue for the title, but you borrow, return, lose and pay fines for one particular copy. Keeping those two ideas apart is what makes 'all copies are out, add me to the queue' possible to say at all.",
    hint: "Ask what a member waits for, and what a member actually carries home.",
  },
  "lld-movie-ticket-booking": {
    breaks: "Without an atomic, expiring hold two buyers pay for one seat or abandoned carts keep seats unsellable, and a retried payment callback books or charges twice.",
    tradeoffs: "A hold takes inventory off the market for its TTL, every anti-double-booking mechanism costs a lock or a retry, and the state machine and idempotency keys add bookkeeping to every write.",
    explainSimply: "It works like putting your hand on the last box of sweets at a counter: while your hand is there nobody else can take it, but if you have not paid within ten minutes the shopkeeper lifts your hand off. Your name goes on the receipt, so paying twice by mistake still buys the box once.",
    hint: "Think about what must stay true of a seat between the moment a user picks it and the moment the payment arrives, and who enforces it.",
  },
  "lld-splitwise": {
    breaks: "Without an exact, validated split and an immutable ledger, balances drift by paise, edits corrupt history, and a group ends up making far more payments than it needs.",
    tradeoffs: "Integer paise and strict validation reject inputs a casual user expects to work, and simplification is either a fast greedy pass that may use more transfers than necessary or an exact search that explodes with group size.",
    explainSimply: "Think of a shared trip notebook where every page is a receipt that can never be erased, only cancelled by a new page. At the end you add up each person's pages to get one number, and the person who is owed most is paid by the person who owes most until everyone is at zero.",
    hint: "Ask what the shares of one expense must add up to, and which unit makes that check exact.",
  },
  "lld-snake-and-ladder": {
    breaks: "Without a dice abstraction and a validated board, the game cannot be tested deterministically, impossible boards make games unwinnable, and each rule variant adds a conditional to the loop.",
    tradeoffs: "Every abstraction is one more class in a small program; the interface for dice and the builder for the board pay off only because tests and configuration need them.",
    explainSimply: "The board is a numbered path, snakes and ladders are shortcuts down or up, and the dice decide how far you go. The trick is to let a tester hand the game a loaded die so every move can be checked, and to inspect the board before the game starts so nobody can be stuck forever.",
    hint: "Ask what in the game is random, and who should be able to replace it.",
  },
  "lld-chess": {
    breaks: "If each piece decides its own legality, pins, discovered checks and castling through check become special cases scattered across six classes, and undo cannot restore a captured piece or a lost castling right.",
    tradeoffs: "Simulating every candidate move costs two board edits per candidate, fine for human play and too slow for an engine, and the board must save and restore three extra position facts on every move.",
    explainSimply: "Each piece only knows the shapes it can move in, like a dancer who knows the steps but not the stage. The board checks each proposed move by trying it, looking whether the king is in danger, and putting everything back. Every accepted move is written on a list with enough detail to undo it.",
    hint: "Ask which question belongs to the piece and which belongs to the board, then ask what one move destroys that undo must bring back.",
  },
  "lld-in-memory-cache": {
    breaks: "A map with a size limit but no order must scan to find the least recently used entry, expired values are served until something notices, and a hot key that expires sends every missing thread to the database at once.",
    tradeoffs: "Links inside the entry make it mutable and couple it to the policy, lazy expiry lets size briefly count stale entries, and because an LRU read is a write, concurrency costs either one lock or an approximate eviction order.",
    explainSimply: "Think of papers on a desk: whatever you touch goes on top, and when the desk is full the bottom sheet is archived. An index card tells you instantly where each paper is, and every sheet knows its two neighbours so pulling one out of the middle is a single tug. A timer throws away sheets that have gone stale even if nobody touches them.",
    hint: "Ask what structure answers where is it and what structure answers who leaves next, then ask how a hit updates the second one without searching.",
  },
  "lld-logging-framework": {
    breaks: "A logger that formats, filters and writes in one method pays for debug messages nobody reads, lets a broken file appender throw into business code, and makes every request wait for the slowest destination.",
    tradeoffs: "Four small interfaces and a registry add classes, the bounded async queue means some INFO lines are dropped under overload by design, and events still in the queue at shutdown are lost unless the context is stopped cleanly.",
    explainSimply: "Think of a newsroom: reporters drop dispatches in a basket and go back to work, an editor's threshold decides what is worth printing, and each outlet prints the story in its own style. The basket has a fixed size, so the rule for a full basket, make reporters wait or bin the gossip, is agreed in advance.",
    hint: "Name the four questions a log call answers, then ask which one must be answered before anything is allocated.",
  },
  "lld-rate-limiter": {
    breaks: "A limiter that tops up buckets with a scheduled task pays per key rather than per request, one that reads and writes its counter in two steps double-spends under concurrent threads, and one that uses wall-clock time grants a free refill after every clock correction.",
    tradeoffs: "Two interfaces where a naive design has one class, elapsed-time arithmetic on every call, a per-bucket lock that serialises a single hot key's callers, and a monotonic clock that is not comparable across processes, which is fine until the limiter must be shared.",
    explainSimply: "Think of a travel card that earns one ride a minute up to ten saved rides. The card does not tick in your pocket: when you tap in, the reader works out how many rides accrued since your last tap and adds them before deciding. Each client has its own card, and cards nobody has tapped for a while are thrown away.",
    hint: "Ask when the refill arithmetic runs, where each client's state lives, and what makes refill-and-spend a single step.",
  },
  "lld-task-scheduler": {
    breaks: "Without one owner of 'what runs next' and a next-run time computed after the run, a slow task is started again on top of itself, a thrown exception ends a recurring job for good, and cancellation races the dispatcher.",
    tradeoffs: "A single dispatcher thread, a DelayQueue and a semaphore of worker permits add moving parts, serialise dispatch, give no priority among jobs due at the same instant, and must move to a shared store with a conditional claim once the scheduler spans machines.",
    explainSimply: "Think of a clinic's appointment book sorted by time. One receptionist calls the next patient only when their time has come and a room is free, a doctor who runs late pushes later patients back but never puts two in one room, and a no-show is rebooked with growing gaps a few times before being struck off. The book, the receptionist and the rooms are three separate things.",
    hint: "Ask who is allowed to touch the queue, and at which moment the next run time is computed.",
  },
  "lld-ride-booking": {
    breaks: "Without an atomic claim on the driver and a single owner of the trip's state, two trips are assigned one driver, a late offer timeout releases a driver who just accepted, and fee and surge rules get hard-coded into the trip.",
    tradeoffs: "Claiming before offering makes a driver unavailable for the whole offer window, sequential offers slow the match when drivers decline, and the in-memory claim and index must move to a shared store once matching spans machines.",
    explainSimply: "Think of a taxi-rank dispatcher with a whiteboard: a magnet beside each driver says free, offered or on a job, and the dispatcher moves the magnet before picking up the radio. Two dispatchers can never radio the same driver, because only one of them finds the magnet on free. The ride itself moves through a fixed set of stages, and what cancelling costs depends on the stage.",
    hint: "Ask at which exact moment a driver stops being available, and who is allowed to move the trip from one stage to the next.",
  },
  "lld-food-ordering": {
    breaks: "Without a frozen snapshot, one idempotency key per checkout and named compensations, a placed order's total drifts with the menu, a retried charge takes the money twice, and a rejection after payment leaves the customer unpaid because there is nothing to roll back.",
    tradeoffs: "Re-reading the menu at checkout adds a confirmation step, paying before placement turns every rejection into a refund, and modelling refunds as retried jobs means a failed refund is something to monitor rather than an exception to catch.",
    explainSimply: "A waiter writes your order on a pad and the kitchen cooks from the pad, never from the menu board, so a price change at the door cannot change your bill. If the kitchen runs out of a dish after the ticket is in, the waiter strikes it off and gives the money back rather than pretending the ticket never existed. The pad is the order; the strike-through is the refund.",
    hint: "Ask what the cart stores, when the price becomes final, and what happens to money that has already moved when a later step says no.",
  },
  "lld-revision": {
    breaks: "Without retrieval practice the patterns stay as vocabulary: you can define Strategy and State but reach for an if-chain the moment a real class is on the whiteboard.",
    tradeoffs: "Redoing a case study from a blank page takes half an hour and feels worse than rereading it in five minutes, and the cards you miss keep coming back; that effort is what moves the pattern from recognition to use.",
    explainSimply: "This page is a deck of cards. Each one describes a coding problem, and you say which design idea solves it before turning the card over. Then, once a week, redo one of the fourteen problems without looking and compare your drawing with the lesson's.",
    hint: "Think about where the rules for one status live now, and where they would live if each status were a class.",
  },
};
