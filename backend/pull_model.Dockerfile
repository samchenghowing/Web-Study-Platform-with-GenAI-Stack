#syntax = docker/dockerfile:1.4

FROM ollama/ollama:latest AS ollama
FROM babashka/babashka:latest

# just using as a client - never as a server
COPY --from=ollama /bin/ollama ./bin/ollama

COPY <<EOF pull_model.clj
(ns pull-model
  (:require [babashka.process :as process]
            [clojure.core.async :as async]))

(try
  (let [llm (get (System/getenv) "LLM")
        embedding_model (get (System/getenv) "EMBEDDING_MODEL")
        url (get (System/getenv) "OLLAMA_BASE_URL")]
    (println "Environment Variables:" (System/getenv))
    (println (format "pulling ollama model %s, embedding model %s using %s" llm embedding_model url))
    (if (and llm url (not (#{"gpt-4" "gpt-3.5" "claudev2"} llm)))

      ;; ----------------------------------------------------------------------
      ;; just call `ollama pull` here - create OLLAMA_HOST from OLLAMA_BASE_URL
      ;; ----------------------------------------------------------------------
      ;; TODO - this still doesn't show progress properly when run from docker compose

      (let [done (async/chan)]
        (async/go-loop [n 0]
          (let [[v _] (async/alts! [done (async/timeout 5000)])]
            (if (= :stop v) :stopped (do (println (format "... pulling model (%ss) - will take several minutes" (* n 10))) (recur (inc n))))))
        (process/shell {:env {"OLLAMA_HOST" url "HOME" (System/getProperty "user.home")} :out :inherit :err :inherit} (format "bash -c './bin/ollama show %s --modelfile > /dev/null || ./bin/ollama pull %s'" llm llm))
        (process/shell {:env {"OLLAMA_HOST" url "HOME" (System/getProperty "user.home")} :out :inherit :err :inherit} (format "bash -c './bin/ollama show %s --modelfile > /dev/null || ./bin/ollama pull %s'" embedding_model embedding_model))
        (async/>!! done :stop))

      (println "OLLAMA model only pulled if both LLM and OLLAMA_BASE_URL are set and the LLM model is not gpt")))
  (catch Throwable _ (System/exit 1)))
EOF

ENTRYPOINT ["bb", "-f", "pull_model.clj"]

