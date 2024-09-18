/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/jsx-key */

"use client";

import { experimental_useObject as useObject } from "ai/react";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { StructuredResponse } from "@/app/api/chat/schema";
import ChessGame from "@/components/Chessboard";

export default function Home() {
  const [input, setInput] = useState<string>("");

  const inputRef = useRef<HTMLInputElement>(null);

  const { submit, isLoading, object } = useObject({
    api: "/api/chat",
    schema: StructuredResponse,
    onFinish({ object }) {},
    onError: (error) => {
      toast.error("There was an API Error, please try again later!");
    },
  });

  const handleSubmit = (value: string) => {
    if (value.trim()) {
      submit({ companyWebsite: value });
    }
  };

  const examples = ["rivian.com", "apple.com", "ford.com"];

  return (
    <div className="flex flex-row justify-center pt-20 h-dvh bg-white dark:bg-zinc-900">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">LLMs vs LLMs Chess</h1>
        <p className="text-md text-zinc-500 dark:text-zinc-400">
          Enter a company website to see where they manufacture.
        </p>
        <ChessGame />
      </div>
    </div>
  );
}
