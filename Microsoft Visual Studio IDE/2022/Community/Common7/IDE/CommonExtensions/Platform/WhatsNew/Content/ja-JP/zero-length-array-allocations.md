---
description: .NET 割り当てツールで長さ 0 の配列割り当てが識別され、メモリ使用量とパフォーマンスを最適化できるようになりました。
area: Debugging & diagnostics
title: 長さ 0 の配列割り当てに関する分析情報
thumbnailImage: ../media/zero-length-array-allocations.png
featureId: zero-length-array-allocations

---


.NET 割り当てツールでは、長さ 0 の配列割り当てに関する詳細な分析情報が提供され、不要なメモリ使用量を特定して最適化できるようになりました。 これらの割り当ては個別には重要でないように見えるかもしれませんが、特に高パフォーマンスまたはメモリ制約のあるアプリケーションでは、すぐに増大してパフォーマンスに影響を与える可能性があります。

![ネイティブ インストルメンテーション ツール](../media/zero-length-array-allocations.mp4)

この更新プログラムにより、[調査] リンクをクリックすると、長さ 0 の配列割り当てを調査できます。これにより、割り当ての詳細が表示された [割り当て] ビューが開きます。 ダブルクリックすると、これらの割り当てが行われるコード パスが表示され、正確な最適化が可能になります。 効率を向上させるには、静的に割り当てられた空の配列インスタンスである `Array.Empty<T>()`を使用して、冗長メモリ割り当てを排除することを検討します。
