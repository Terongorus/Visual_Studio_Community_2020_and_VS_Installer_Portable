---
description: Инструмент выделения .NET теперь выявляет выделенные массивы нулевой длины, чтобы помочь вам оптимизировать использование памяти и производительность.
area: Debugging & diagnostics
title: Аналитика выделения массивов нулевой длины
thumbnailImage: ../media/zero-length-array-allocations.png
featureId: zero-length-array-allocations

---


Инструмент выделения .NET теперь предоставляет подробную аналитическую информацию о выделенных массивов нулевой длины, чтобы помочь вам выявить напрасно используемые ресурсы памяти и оптимизировать их использование. Хотя на первый взгляд эти выделения по отдельности могут показаться незначительными, они могут быстро накапливаться и негативно влиять на производительность, особенно если речь идет о выполнении задач, требующих высокой производительности или с ограниченными ресурсами памяти.

![Средство инструментирования платформенно-ориентированного кода](../media/zero-length-array-allocations.mp4)

Данное обновление позволяет вам выявить выделенные массивы нулевой длины. Для этого нажмите ссылку "Исследовать", после чего откроется окно "Выделение" с информацией о выделении. Если вы дважды щелкните выделение, отобразятся пути к коду, где они находятся, позволяя вам внести точные корректировки. Для повышения эффективности мы рекомендуем использовать `Array.Empty<T>()` — статически выделенный пустой экземпляр массива, чтобы устранить избыточные выделенные ресурсы памяти.
