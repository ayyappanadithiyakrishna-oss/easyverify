"use client";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";

const items = [
  {
    q: "Is this legal advice?",
    a: "No. EasyVerify organizes official guidance and shows its sources. Completion is self-reported and is not a legal certification.",
  },
  {
    q: "Which states are covered?",
    a: "The federal baseline applies nationwide. California references are included with an explicit review status. Other states still need research.",
  },
  {
    q: "Do I need to upload employee documents?",
    a: "No. The planner only uses business details such as location, contract clauses and start date. Shared links recreate those answers, not records.",
  },
  {
    q: "How does the assistant work?",
    a: "A small language model runs inside your browser. It answers from the rule reference and shows the source beside each reply.",
  },
];

export function Faq() {
  return (
    <Accordion.Root type="single" collapsible className="faq">
      {items.map((item) => (
        <Accordion.Item key={item.q} value={item.q} className="faq-item">
          <Accordion.Header asChild>
            <h3>
              <Accordion.Trigger className="faq-trigger">
                {item.q}
                <ChevronDown size={18} aria-hidden="true" />
              </Accordion.Trigger>
            </h3>
          </Accordion.Header>
          <Accordion.Content className="faq-content">
            <p>{item.a}</p>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
