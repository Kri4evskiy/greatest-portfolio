---
name: react-hook-form
description: Use for client-side forms built with React Hook Form. Focus on correctness, validation strategy, and subscription performance.
---

# React Hook Form

## Core rules

- всегда задавать `defaultValues`;
- для сложной валидации использовать `zodResolver`;
- не злоупотреблять `watch()` на верхнем уровне;
- предпочитать `useWatch()` и более глубокие подписки;
- controlled inputs подключать аккуратно через `Controller` или `useController`;
- ошибки и submit-state должны быть предсказуемыми.

## Use when

- регистрация;
- логин;
- contact forms;
- profile/settings forms;
- admin/editor forms.
