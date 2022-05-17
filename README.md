# Repository


## Update a branch from wegas

Download the zip from Wegas (Gamemodel settings -> "export" tab -> ZIP).
Then, run `./updateFromZip.sh <EXPORT.zip> [BRANCH_NAME]`.

## Update gamemodel in wegas

1. Run `createZip.sh`.
1. patch gameModel (Gamemodel settings -> "export" tab -> ZIP).


## Merge branches


```mermaid
flowchart TD
    subgraph w1a [wegas deployment A]
       A1[Export GameModel as ZIP]
   end
    subgraph w2a [wegas deployment B]
       B1[Export GameModel as ZIP]
   end

    subgraph local-branch
       A2["update local-branch with  #quot;updateFromZip.sh the.zip LOCAL_BRANCH#quot;"]
       A3[review changes]
       A4[commit changes]
       A5[sync'd]
       A1-->A2
       A2-->A3
       A3-->A4
       A4-->A5
    end
    subgraph master
       B2["update master with #quot;updateFromZip.sh the.zip master#quot;"]
       B3[review changes]
       B4[commit changes]
       B5[merged]
       B6{any conflicts?}
       B7[resolve them]
       B7b[commit]
       B8[done]
       B9["create brand new ZIP with #quot;./createZip.sh master#quot;"]
       B1-->B2
       B2-->B3
       B3-->B4
       B4-->B5
       B5-->B6
       B6-->|yes| B7
       B7-->B7b
       B7b-->B8
       B6-->|no| B8
       B8-->B9
    end
    subgraph w1b [wegas deployment A]
       A99[Patch gameModel from brand new ZIP]
   end
    subgraph w2b [wegas deployment B]
       B99[Patch gameModel from brand new ZIP]
   end

    B9-->A99
    B9-->B99
    A4--merge-->B5
    B8--merge-->A5
```

