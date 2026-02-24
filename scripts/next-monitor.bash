#!/bin/bash

mode="next"
if [[ "$1" == "prev"  ]]; then
  mode="prev"
fi

monitors=$(aerospace list-monitors --json | jq '. | length')
# echo monitors: "$monitors"

cur=$(aerospace list-monitors --focused --json | jq '.[0]."monitor-id"');
# echo "current: $cur"

# base-0
zcur=$(( cur - 1 ))

if [[ "$mode" == "next" ]]; then
  next=$(( (zcur + 1) % monitors + 1 ));
  aerospace focus-monitor $next
else
  prev=$(( (zcur + monitors - 1) % monitors + 1));
  aerospace focus-monitor $prev
fi
