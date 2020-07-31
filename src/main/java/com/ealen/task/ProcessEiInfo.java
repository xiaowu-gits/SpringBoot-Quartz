package com.ealen.task;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;


/**
 * 计算告警信息
 * 只计算：
 * 模块运行超时
 * 模块延迟启动
 */
@Service("processEiInfo")
public class ProcessEiInfo implements TaskInterface {
    private static final Logger logger = LoggerFactory.getLogger(ProcessEiInfo.class);



    public void  processEi(String param, Date date, String group, String name) {
        logger.info("开始处理EI,current mills :{},{},{},{}", param, date, group, name);
//        redisService.remove(DATA_EI);
    }

    @Override
    public void execute(String param, Date date, Date preTime, String group, String name) {
        processEi(param, date, group, name);
    }
}
