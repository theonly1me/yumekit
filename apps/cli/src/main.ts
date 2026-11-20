#!/usr/bin/env node
import { formatVersion, version } from "./index.js";

process.stdout.write(formatVersion(version));
